(function() {
  const K = window.SC3;
  const D = window.SC3_DATA;
  const fmt = window.SC3_MONEY.fmt;
  const Base = K.Empty;
  const { Button } = K;
  function Empty(props) {
    if (props.title !== "Connect your stock data to start") return /* @__PURE__ */ React.createElement(Base, { ...props });
    const open = props.action && props.action.props && props.action.props.onClick;
    return /* @__PURE__ */ React.createElement(
      Base,
      {
        ...props,
        title: "Confirm Setup to start watching",
        body: `Your distributors' stock export is mapped: ${fmt.num(D.SETUP.dms.rows)} batches from ${Object.keys(D.DISTRIBUTORS).length} distributors. Review the guardrails and confirm; the Watcher checks at ${window.SC3_STORE.get().rules.watchTime} the next morning.`,
        action: /* @__PURE__ */ React.createElement(Button, { variant: "primary", iconRight: "arrow-right", onClick: open }, "Review and confirm")
      }
    );
  }
  Object.assign(window.SC3, { Empty });
})();
