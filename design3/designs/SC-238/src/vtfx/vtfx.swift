// SC-238: the film's 60 fps. Apple's on-device frame-rate conversion (VideoToolbox's VTFrameProcessor, macOS 15.4+)
// interpolates a 24 fps clip to 60 fps: every source frame is kept where a 60 fps frame falls on it (every fifth
// frame), and the four between are made by the model at phases 0.4, 0.8, 0.2 and 0.6 of their source interval. The
// picture only (an AVAssetWriter fed video before audio stalls); frc.sh copies the clip's own audio back on with ffmpeg,
// so a lip-synced line stays where it was. Out: ProRes 422 HQ, BT.709.
//
//   vtfx frc in.mp4 out.mov [--fps 60] [--start s] [--dur d] [--quality normal|quality]
//   vtfx sr in.mp4 out.mov [--width 1920]     Apple's on-device super resolution (VTSuperResolutionScaler, ×4, the
//                                             video model: each frame with the one before it), then down to --width
//                                             with an averaging downsample; same frame rate, ProRes 422 HQ
//   vtfx info in.mp4
import Foundation
import AVFoundation
import VideoToolbox
import CoreVideo
import CoreMedia

func die(_ s: String) -> Never { FileHandle.standardError.write((s + "\n").data(using: .utf8)!); exit(1) }

func arg(_ name: String, _ def: String? = nil) -> String? {
    let a = CommandLine.arguments
    if let i = a.firstIndex(of: name), i + 1 < a.count { return a[i + 1] }
    return def
}

func makePool(_ attrs: [String: Any], w: Int, h: Int, format: OSType) -> CVPixelBufferPool {
    var a = attrs
    a[kCVPixelBufferPixelFormatTypeKey as String] = format
    a[kCVPixelBufferWidthKey as String] = w
    a[kCVPixelBufferHeightKey as String] = h
    a[kCVPixelBufferIOSurfacePropertiesKey as String] = [String: Any]()
    var pool: CVPixelBufferPool?
    let r = CVPixelBufferPoolCreate(nil, [kCVPixelBufferPoolMinimumBufferCountKey as String: 8] as CFDictionary, a as CFDictionary, &pool)
    if r != kCVReturnSuccess || pool == nil { die("pool \(r)") }
    return pool!
}

func newBuffer(_ pool: CVPixelBufferPool) -> CVPixelBuffer {
    var pb: CVPixelBuffer?
    let r = CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pb)
    if r != kCVReturnSuccess || pb == nil { die("buffer \(r)") }
    return pb!
}

let bt709: [String: Any] = [
    AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
    AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
    AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
]

func frc(_ inPath: String, _ outPath: String) async throws {
    let outFps = Int(arg("--fps", "60")!)!
    let asset = AVURLAsset(url: URL(fileURLWithPath: inPath))
    guard let vt = try await asset.loadTracks(withMediaType: .video).first else { die("no video") }
    let size = try await vt.load(.naturalSize)
    let nominal = try await vt.load(.nominalFrameRate)
    let inFps = Int(nominal.rounded())
    let w = Int(size.width), h = Int(size.height)
    guard inFps > 0, outFps > inFps else { die("fps \(inFps) -> \(outFps)") }

    let reader = try AVAssetReader(asset: asset)
    if let s = arg("--start") {
        let start = CMTime(seconds: Double(s)!, preferredTimescale: 600)
        let dur = arg("--dur").map { CMTime(seconds: Double($0)!, preferredTimescale: 600) } ?? .positiveInfinity
        reader.timeRange = CMTimeRange(start: start, duration: dur)
    }
    let vout = AVAssetReaderTrackOutput(track: vt, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
    vout.alwaysCopiesSampleData = false
    reader.add(vout)

    let quality: VTFrameRateConversionConfiguration.QualityPrioritization = arg("--quality", "quality") == "normal" ? .normal : .quality
    guard let cfg = VTFrameRateConversionConfiguration(frameWidth: w, frameHeight: h, usePrecomputedFlow: false,
                                                        qualityPrioritization: quality, revision: VTFrameRateConversionConfiguration.defaultRevision)
    else { die("frc config \(w)x\(h)") }
    let proc = VTFrameProcessor()
    try proc.startSession(configuration: cfg)
    defer { proc.endSession() }
    let half = kCVPixelFormatType_64RGBAHalf
    let srcPool = makePool(cfg.sourcePixelBufferAttributes, w: w, h: h, format: half)
    let dstPool = makePool(cfg.destinationPixelBufferAttributes, w: w, h: h, format: half)
    let outPool = makePool([:], w: w, h: h, format: kCVPixelFormatType_32BGRA)
    var xfer: VTPixelTransferSession?
    VTPixelTransferSessionCreate(allocator: nil, pixelTransferSessionOut: &xfer)
    guard let xfer else { die("transfer") }

    try? FileManager.default.removeItem(atPath: outPath)
    let writer = try AVAssetWriter(outputURL: URL(fileURLWithPath: outPath), fileType: .mov)
    let vin = AVAssetWriterInput(mediaType: .video, outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.proRes422HQ, AVVideoWidthKey: w, AVVideoHeightKey: h, AVVideoColorPropertiesKey: bt709,
    ])
    vin.expectsMediaDataInRealTime = false
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: vin, sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA, kCVPixelBufferWidthKey as String: w, kCVPixelBufferHeightKey as String: h,
    ])
    writer.add(vin)
    guard reader.startReading() else { die("read: \(String(describing: reader.error))") }
    writer.startWriting()
    writer.startSession(atSourceTime: .zero)

    // frames in, in order; out at k/outFps. For source interval i (frames i, i+1), each k with floor(k*in/out) == i.
    func toHalf(_ s: CVPixelBuffer) -> CVPixelBuffer { let d = newBuffer(srcPool); VTPixelTransferSessionTransferImage(xfer, from: s, to: d); return d }
    func toBGRA(_ s: CVPixelBuffer) -> CVPixelBuffer { let d = newBuffer(outPool); VTPixelTransferSessionTransferImage(xfer, from: s, to: d); return d }
    func append(_ pb: CVPixelBuffer, _ k: Int) {
        while !vin.isReadyForMoreMediaData { usleep(2000) }
        if !adaptor.append(pb, withPresentationTime: CMTime(value: CMTimeValue(k), timescale: CMTimeScale(outFps))) { die("append \(k): \(String(describing: writer.error))") }
    }
    var prev: CVPixelBuffer? = nil       // the half-float source frame i
    var prevBGRA: CVPixelBuffer? = nil
    var i = -1                           // index of prev
    var k = 0                            // next output frame
    var first = true
    var made = 0, kept = 0
    while let sb = vout.copyNextSampleBuffer() {
        guard let pb = CMSampleBufferGetImageBuffer(sb) else { continue }
        let cur = toHalf(pb)
        i += 1
        if let p = prev {
            // outputs strictly inside (i-1, i): phases (k*in - (i-1)*out)/out
            var phases: [Float] = [], ks: [Int] = []
            while k * inFps < i * outFps {
                let num = k * inFps - (i - 1) * outFps
                if num == 0 { append(prevBGRA!, k); kept += 1 } else { phases.append(Float(num) / Float(outFps)); ks.append(k) }
                k += 1
            }
            if !phases.isEmpty {
                let dsts = phases.map { _ in VTFrameProcessorFrame(buffer: newBuffer(dstPool), presentationTimeStamp: .zero)! }
                let a = VTFrameProcessorFrame(buffer: p, presentationTimeStamp: CMTime(value: CMTimeValue(i - 1), timescale: CMTimeScale(inFps)))!
                let b = VTFrameProcessorFrame(buffer: cur, presentationTimeStamp: CMTime(value: CMTimeValue(i), timescale: CMTimeScale(inFps)))!
                guard let params = VTFrameRateConversionParameters(sourceFrame: a, nextFrame: b, opticalFlow: nil, interpolationPhase: phases,
                                                                    submissionMode: first ? .sequentialReferencesUnchanged : .sequential, destinationFrames: dsts)
                else { die("params at \(i)") }
                if first {
                    // the model's first call returns a broken frame: prime it on this pair and throw the result away
                    let warm = phases.map { _ in VTFrameProcessorFrame(buffer: newBuffer(dstPool), presentationTimeStamp: .zero)! }
                    if let wp = VTFrameRateConversionParameters(sourceFrame: a, nextFrame: b, opticalFlow: nil, interpolationPhase: phases,
                                                                submissionMode: .random, destinationFrames: warm) { try await proc.process(parameters: wp) }
                }
                try await proc.process(parameters: params)
                first = false
                for (j, d) in dsts.enumerated() { append(toBGRA(d.buffer), ks[j]); made += 1 }
            }
        }
        prev = cur; prevBGRA = toBGRA(cur)
    }
    // the last source frame, where an output falls on it
    if let pbB = prevBGRA, k * inFps == i * outFps { append(pbB, k); kept += 1; k += 1 }
    vin.markAsFinished()
    await writer.finishWriting()
    if writer.status != .completed { die("write: \(String(describing: writer.error))") }
    print("frc \(inPath) \(w)x\(h) \(inFps)→\(outFps) fps: \(i + 1) frames in, \(k) out (\(kept) kept, \(made) made)")
}


func sr(_ inPath: String, _ outPath: String) async throws {
    let asset = AVURLAsset(url: URL(fileURLWithPath: inPath))
    guard let vt = try await asset.loadTracks(withMediaType: .video).first else { die("no video") }
    let size = try await vt.load(.naturalSize)
    let fps = try await vt.load(.nominalFrameRate)
    let w = Int(size.width), h = Int(size.height)
    let outW = Int(arg("--width", "1920")!)!
    let outH = Int((Double(h) * Double(outW) / Double(w) / 2).rounded()) * 2
    guard let cfg = VTSuperResolutionScalerConfiguration(frameWidth: w, frameHeight: h, scaleFactor: 4, inputType: .video, usePrecomputedFlow: false,
                                                         qualityPrioritization: .normal, revision: VTSuperResolutionScalerConfiguration.defaultRevision)
    else { die("sr config \(w)x\(h)") }
    if cfg.configurationModelStatus != .ready { die("sr model not ready (status \(cfg.configurationModelStatus.rawValue)): nothing is downloaded here") }
    let reader = try AVAssetReader(asset: asset)
    let vout = AVAssetReaderTrackOutput(track: vt, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
    vout.alwaysCopiesSampleData = false
    reader.add(vout)
    let proc = VTFrameProcessor()
    try proc.startSession(configuration: cfg)
    defer { proc.endSession() }
    let half = kCVPixelFormatType_64RGBAHalf
    let srcPool = makePool(cfg.sourcePixelBufferAttributes, w: w, h: h, format: half)
    let dstPool = makePool(cfg.destinationPixelBufferAttributes, w: w * 4, h: h * 4, format: half)
    let outPool = makePool([:], w: outW, h: outH, format: kCVPixelFormatType_32BGRA)
    var xfer: VTPixelTransferSession?
    VTPixelTransferSessionCreate(allocator: nil, pixelTransferSessionOut: &xfer)
    guard let xfer else { die("transfer") }
    VTSessionSetProperty(xfer, key: kVTPixelTransferPropertyKey_DownsamplingMode, value: kVTDownsamplingMode_Average)
    try? FileManager.default.removeItem(atPath: outPath)
    let writer = try AVAssetWriter(outputURL: URL(fileURLWithPath: outPath), fileType: .mov)
    let vin = AVAssetWriterInput(mediaType: .video, outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.proRes422HQ, AVVideoWidthKey: outW, AVVideoHeightKey: outH, AVVideoColorPropertiesKey: bt709,
    ])
    vin.expectsMediaDataInRealTime = false
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: vin, sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA, kCVPixelBufferWidthKey as String: outW, kCVPixelBufferHeightKey as String: outH,
    ])
    writer.add(vin)
    guard reader.startReading() else { die("read: \(String(describing: reader.error))") }
    writer.startWriting()
    writer.startSession(atSourceTime: .zero)
    let rate = CMTimeScale(fps.rounded())
    var prevSrc: VTFrameProcessorFrame? = nil, prevOut: VTFrameProcessorFrame? = nil
    var n = 0
    while let sb = vout.copyNextSampleBuffer() {
        guard let pb = CMSampleBufferGetImageBuffer(sb) else { continue }
        let cur = newBuffer(srcPool); VTPixelTransferSessionTransferImage(xfer, from: pb, to: cur)
        let pts = CMTime(value: CMTimeValue(n), timescale: rate)
        let src = VTFrameProcessorFrame(buffer: cur, presentationTimeStamp: pts)!
        let dst = VTFrameProcessorFrame(buffer: newBuffer(dstPool), presentationTimeStamp: pts)!
        guard let params = VTSuperResolutionScalerParameters(sourceFrame: src, previousFrame: prevSrc, previousOutputFrame: prevOut, opticalFlow: nil,
                                                               submissionMode: .sequential, destinationFrame: dst) else { die("sr params at \(n)") }
        try await proc.process(parameters: params)
        let o = newBuffer(outPool); VTPixelTransferSessionTransferImage(xfer, from: dst.buffer, to: o)
        while !vin.isReadyForMoreMediaData { usleep(2000) }
        if !adaptor.append(o, withPresentationTime: pts) { die("append \(n): \(String(describing: writer.error))") }
        prevSrc = src; prevOut = dst; n += 1
    }
    vin.markAsFinished()
    await writer.finishWriting()
    if writer.status != .completed { die("write: \(String(describing: writer.error))") }
    print("sr \(inPath) \(w)x\(h) ×4 → \(outW)x\(outH): \(n) frames at \(rate) fps")
}

extension CMSampleBuffer {
    func offsettingTiming(by off: CMTime) throws -> CMSampleBuffer {
        var count: CMItemCount = 0
        CMSampleBufferGetSampleTimingInfoArray(self, entryCount: 0, arrayToFill: nil, entriesNeededOut: &count)
        var info = [CMSampleTimingInfo](repeating: CMSampleTimingInfo(), count: count)
        CMSampleBufferGetSampleTimingInfoArray(self, entryCount: count, arrayToFill: &info, entriesNeededOut: &count)
        for j in 0..<count { info[j].presentationTimeStamp = CMTimeAdd(info[j].presentationTimeStamp, off); if info[j].decodeTimeStamp.isValid { info[j].decodeTimeStamp = CMTimeAdd(info[j].decodeTimeStamp, off) } }
        var out: CMSampleBuffer?
        CMSampleBufferCreateCopyWithNewTiming(allocator: nil, sampleBuffer: self, sampleTimingEntryCount: count, sampleTimingArray: &info, sampleBufferOut: &out)
        return out!
    }
}

let a = CommandLine.arguments
guard a.count >= 3 else { die("usage: vtfx frc in out [--fps 60] [--start s --dur d] | vtfx info in") }
let sem = DispatchSemaphore(value: 0)
Task {
    do {
        switch a[1] {
        case "frc": try await frc(a[2], a[3])
        case "sr": try await sr(a[2], a[3])
        case "info":
            let asset = AVURLAsset(url: URL(fileURLWithPath: a[2]))
            let vt = try await asset.loadTracks(withMediaType: .video).first!
            print(try await vt.load(.naturalSize), try await vt.load(.nominalFrameRate), try await asset.load(.duration).seconds)
        default: die("unknown \(a[1])")
        }
    } catch { die("error: \(error)") }
    sem.signal()
}
sem.wait()
