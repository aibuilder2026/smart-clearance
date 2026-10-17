import Foundation
import VideoToolbox
import CoreVideo

func fourcc(_ v: UInt32) -> String {

    let c = [UInt8((v >> 24) & 255), UInt8((v >> 16) & 255), UInt8((v >> 8) & 255), UInt8(v & 255)]
    return String(bytes: c, encoding: .ascii) ?? "\(v)"
}
print("FRC supported:", VTFrameRateConversionConfiguration.isSupported, "default revision:", VTFrameRateConversionConfiguration.defaultRevision.rawValue)
if let c = VTFrameRateConversionConfiguration(frameWidth: 1920, frameHeight: 1080, usePrecomputedFlow: false, qualityPrioritization: .quality, revision: VTFrameRateConversionConfiguration.defaultRevision) {
    print("FRC formats:", c.frameSupportedPixelFormats.map { fourcc(UInt32($0)) })
    print("FRC src attrs:", c.sourcePixelBufferAttributes)
}
print("SR supported:", VTSuperResolutionScalerConfiguration.isSupported, "factors:", VTSuperResolutionScalerConfiguration.supportedScaleFactors)
for f in VTSuperResolutionScalerConfiguration.supportedScaleFactors {
    if let c = VTSuperResolutionScalerConfiguration(frameWidth: 1280, frameHeight: 704, scaleFactor: f, inputType: .video, usePrecomputedFlow: false, qualityPrioritization: .normal, revision: VTSuperResolutionScalerConfiguration.defaultRevision) {
        print("SR x\(f) model status:", c.configurationModelStatus.rawValue, "(0 download required, 1 downloading, 2 ready)", "attrs:", c.sourcePixelBufferAttributes)
    } else { print("SR x\(f): nil config for 1280x704") }
}
print("MotionBlur supported:", VTMotionBlurConfiguration.isSupported, " TemporalNoise:", VTTemporalNoiseFilterConfiguration.isSupported)
