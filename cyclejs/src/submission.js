import {div, input, p} from '@cycle/dom';
import Confirm from './confirm'
import xs from 'xstream'
import withComponent from './helper'

const intent = (DOM,childSubmit$)=> {
  const input$ = DOM.select('.field').events('input')
  const newValue$ = input$
    .map(e => ({type:'INPUT', data:e.target.value}))
  const submit$ = input$
    .map(i=> childSubmit$.map(s=>({type:'SUBMIT', data:i.target.value})))
    .flatten()
  return xs.merge(submit$,newValue$)
}

const model = action$ => action$.fold((state, action)=> {
  switch(action.type){
    case 'INPUT': return {...state, input: action.data}
    case 'SUBMIT': return {submission: action.data, input: ''}
    default: return state
  }
}, {submission:'',input:''} )

const view = (state$,confirmvtree$)=>
  xs.combine(state$,confirmvtree$).map(([state,confirmvtree])=>
    div('.child',[
      input('.field', {props:{value: state.input}}),
      confirmvtree,
      p('Submitted value: '+state.submission)
    ])
  )

function Submission(sources){
  const action$ = intent(sources.DOM, sources.childsinks.submit$)
  const state$ = model(action$)
  const vtree$ = view(state$, sources.childsinks.DOM)
  return {
    DOM: vtree$,
    disabled$: action$.map(a => a.type === 'SUBMIT' || !a.data)
  }
}

export default withComponent(Submission,Confirm,'disabled$')