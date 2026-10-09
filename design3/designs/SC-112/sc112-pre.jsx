// SC-112's mockups, loaded after screens/common.js and before the screens: a Screen that, inside a batch's frame, takes
// the frame's title, line, back link and the row under the title, so every screen's own body stays as designed. Outside
// a frame it is the app's own Screen. The brand screens read Screen once as they load, so it is replaced here first.
(function () {
  const { createContext, useContext } = React;
  const S = window.SC3_SCREENS; const Orig = S.Screen;
  const FrameCtx = createContext(null);
  function Screen(props) {
    const f = useContext(FrameCtx);
    if (!f) return <Orig {...props} />;
    const pick = k => (f[k] !== undefined ? f[k] : props[k]);
    return <Orig {...props} title={pick("title")} sub={pick("sub")} back={pick("back")} below={pick("below")} hideLarge={pick("hideLarge")} />;
  }
  S.Screen = Screen;
  S.SC112 = { FrameCtx, OrigScreen: Orig };
})();
