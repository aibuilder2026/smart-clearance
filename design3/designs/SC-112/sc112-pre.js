(function() {
  const { createContext, useContext } = React;
  const S = window.SC3_SCREENS;
  const Orig = S.Screen;
  const FrameCtx = createContext(null);
  function Screen(props) {
    const f = useContext(FrameCtx);
    if (!f) return /* @__PURE__ */ React.createElement(Orig, { ...props });
    const pick = (k) => f[k] !== void 0 ? f[k] : props[k];
    return /* @__PURE__ */ React.createElement(Orig, { ...props, title: pick("title"), sub: pick("sub"), back: pick("back"), below: pick("below"), hideLarge: pick("hideLarge") });
  }
  S.Screen = Screen;
  S.SC112 = { FrameCtx, OrigScreen: Orig };
})();
