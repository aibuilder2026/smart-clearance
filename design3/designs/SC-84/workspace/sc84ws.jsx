// SC-84's workspace mockup: the Command Center's first card when the stock export was mapped in the console but Setup
// is not yet confirmed. Loaded after system/product.js and before the screens, it wraps the kit's Empty so the card
// that read "Connect your stock data to start" says what is left: the guardrails, then the yes. Fictional throughout.
(function () {
  const K = window.SC3; const D = window.SC3_DATA; const fmt = window.SC3_MONEY.fmt; const Base = K.Empty; const { Button } = K;
  function Empty(props) {
    if (props.title !== "Connect your stock data to start") return <Base {...props} />;
    const open = props.action && props.action.props && props.action.props.onClick;
    return <Base {...props} title="Confirm Setup to start watching"
      body={`Your distributors' stock export is mapped: ${fmt.num(D.SETUP.dms.rows)} batches from ${Object.keys(D.DISTRIBUTORS).length} distributors. Review the guardrails and confirm; the Watcher checks at ${window.SC3_STORE.get().rules.watchTime} the next morning.`}
      action={<Button variant="primary" iconRight="arrow-right" onClick={open}>Review and confirm</Button>} />;
  }
  Object.assign(window.SC3, { Empty });
})();
