import choo from 'choo'
import Confirm from './confirm'

const Submission = app => {
  const confirm = Confirm(app,'sub:submit')
  app.model({
    namespace: 'sub',
    state: { field: '', submitted: '' },
    reducers: {
      setField: (action, state) => ({ field: action.payload }),
      submit: (action, state) => ({ field: '', submitted: state.field })
    }
  })
  return (params, state, send) => {
    const onChangeHandler = e => send('sub:setField', {payload:e.target.value} )
    return choo.view`
      <div>
        <input value=${state.sub.field} oninput=${onChangeHandler} />
        ${confirm(state, !state.sub.field, send)}
        <p>Submitted value: ${state.sub.submitted}</p>
      </div>
    `
  }
}

export default Submission