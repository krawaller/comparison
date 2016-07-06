// a helper function for CycleJS composition
// more info here: https://twitter.com/krawaller/status/743150786117517312

import xs from 'xstream'

export default (parent, child, ...dependencies) => sources => {
  let proxies = dependencies.reduce((proxies,dep)=>({
    ...proxies,
    [dep]: xs.create()
  }),{})
  const childsinks = child({...sources,...proxies})
  const sinks = parent({...sources,['childsinks']:childsinks})
  Object.keys(proxies).forEach(proxy => proxies[proxy].imitate(sinks[proxy]))
  return sinks
}
