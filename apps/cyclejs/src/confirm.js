import {span, button} from '@cycle/dom';
import xs from 'xstream'

const intent = sources=> xs.merge(
  sources.disabled$.map(i=> i ? 'DISABLE' : 'ENABLE'),
  sources.DOM.select('.maybe').events('click').map(i=>'MAYBE'),
  sources.DOM.select('.cancel').events('click').map(i=>'CANCEL'),
  sources.DOM.select('.confirm').events('click').map(i=>'CONFIRM')
)

const model = action$ => action$.fold((s,action)=> {
  switch(action){
    case 'DISABLE': return 'disabled'
    case 'MAYBE': return 'confirm'
    case 'ENABLE': return s === 'disabled' ? 'waiting' : s
    default: return 'waiting'
  }
},'disabled')

const view = state$ => state$.map(state=> state === 'confirm'
  ? span([button('.confirm','Confirm'),button('.cancel','Cancel')])
  : button('.maybe',{attrs:{disabled: state === 'disabled'}},'Submit')
)

export default sources=> {
  const action$ = intent(sources)  
  const state$ = model(action$)
  const vtree$ = view(state$)
  return {
    DOM: vtree$,
    submit$: action$.filter(i => i === 'CONFIRM')
  }
}