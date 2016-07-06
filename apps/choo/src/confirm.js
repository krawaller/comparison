import choo from 'choo'

const Confirm = (app,confirmevent)=> {
  app.model({
    namespace: 'confButt',
    state: { button: 'waiting' },
    reducers: {
      maybeSubmit: (action, state) => ({button: 'confirm'}),
      cancelSubmit: (action, state) => ({button: 'waiting'})
    },
    effects: {
      confirmSubmit: (action, state, send)=> {
        send('confButt:cancelSubmit')
        send(confirmevent)
      }
    }
  })
  return (state, disabled, send) => state.confButt.button !== 'confirm' 
    ? choo.view`
      <button onclick=${e => send('confButt:maybeSubmit')} disabled=${disabled}>Submit</button>
    `
    : choo.view`
      <span>
        <button onclick=${e => send('confButt:cancelSubmit')}>Cancel</button>
        <button onclick=${e => send('confButt:confirmSubmit')}>Confirm</button>
      </span>
    `
}

export default Confirm