### Rationale

comparing composition [React]() [Angular2]() [Choo]() [Cycle](). yada yada blah

### The app

definining the components etc etc

![overview](https://raw.githubusercontent.com/krawaller/comparison/master/overview.svg)

### React implementation

Webpackbin [here](http://www.webpackbin.com/Ey70dIVI-)

Code for Confirm component:

```typescript
let Confirm = React.createClass({
  getInitialState: ()=> ({status:'waiting'}),
  maybe() { this.setState({status:'confirm'}) },
  changedmymind() { this.setState({status:'waiting'}) },
  yesimsure() { this.props.confirm(); this.setState({status:'waiting'}) },
  render() {
    return this.state.status !== 'confirm'
    ? <button onClick={this.maybe} disabled={this.props.disabled}>Submit</button>
    : <span>
        <button onClick={this.changedmymind}>Cancel</button>
        <button onClick={this.yesimsure}>Confirm</button>
      </span>
  }
})
```

Code for Submission component:

```typescript
let Submission = React.createClass({
  getInitialState: ()=> ({submission:'',field:''}),
  onConfirm() { this.setState({submission:this.state.field,field:''}) },
  onChange(e) { this.setState({field:e.target.value}) },
  render() {
    return (
      <div>
        <input value={this.state.field} onChange={this.onChange}/>
        <Confirm disabled={!this.state.field} confirm={this.onConfirm}/>
        <p>Submitted value: {this.state.submission}</p>
      </div>
    )
  }
})
```


### Angular2 implementation:

yada blah, Webpackbin [here](http://www.webpackbin.com/VkPFPSXL-)

Code for Confirm component:

```typescript
@Component({
  selector: 'confirm',
  template: `
    <span *ngIf="state !== 'confirm'">
      <button (click)="maybe()" [disabled]="state === 'disabled'">Submit</button>
    </span>
    <span *ngIf="state === 'confirm'">
      <button (click)="changedmymind()">Cancel</button>
      <button (click)="yesimsure()">Confirm</button>
    </span>
  `
})
export class Confirm {
  state: string = 'waiting'
  @Output() confirm = new EventEmitter()
  @Input() set disabled(bool: boolean){
    this.state = bool ? 'disabled' : 'waiting'
  }
  maybe() { this.state = 'confirm' }
  changedmymind() { this.state = 'waiting' }
  yesimsure() { this.confirm.emit(); this.state = 'waiting' }
}
```

Code for submission component:

```typescript
@Component({
  selector: 'submission',
  template: `
    <input #field (input)="0">
    <confirm (confirm)="onConfirm()" [disabled]="!field.value.length"></confirm>
    <p>Submitted value: {{submitted}}</p>
  `,
  directives: [Confirm]
})
class Submission {
  @ViewChild('field') input: Control
  onConfirm() {
    this.submitted = this.input.nativeElement.value
    this.input.nativeElement.value = ''
  }
}
```

### CycleJS implementation

Webpackbin [here](http://www.webpackbin.com/NJD02H4L-)

Code for Confirm component: 

```typescript
const intent = sources=> xs.merge(
  sources.disabled$.map(i=> i ? 'DISABLE' : 'ENABLE'),
  sources.DOM.select('.maybe').events('click').map(i=>'MAYBE'),
  sources.DOM.select('.cancel').events('click').map(i=>'CANCEL'),
  sources.DOM.select('.confirm').events('click').map(i=>'CONFIRM')
)

const model = action$ => action$.fold((s,action)=> {
  switch(action){
    case 'DISABLE': return 'disabled'
    case 'MAYBE': return 'areyousure'
    case 'ENABLE': return s === 'disabled' ? 'waiting' : s
    default: return 'waiting'
  }
},'disabled')

const view = state$ => state$.map(state=> state === 'areyousure'
  ? span([button('.confirm','Confirm'),button('.cancel','Cancel')])
  : button('.maybe',{attrs:{disabled: state === 'disabled'}},'Submit')
)

const Confirm = sources=> {
  const action$ = intent(sources)  
  const state$ = model(action$)
  const vtree$ = view(state$)
  return {
    DOM: vtree$,
    submit$: action$.filter(i => i === 'CONFIRM')
  }
}
```

Code for Submission component:

```typescript
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

function SubmissionMain(sources){
  const action$ = intent(sources.DOM, sources.childsinks.submit$)
  const state$ = model(action$)
  const vtree$ = view(state$, sources.childsinks.DOM)
  return {
    DOM: vtree$,
    disabled$: action$.map(a => a.type === 'SUBMIT' || !a.data)
  }
}

const Submission = withComponent(SubmissionMain,Confirm,'disabled$')
```

Using the helper introduced in [this post](http://blog.krawaller.se/posts/exploring-composition-in-cyclejs/).

### Choo implementation

Webpackbin [here](http://www.webpackbin.com/4y4Mt94UZ)

The Confirm component:

```typescript
const Confirm = (app,confirmevent)=> {
  app.model({
    namespace: 'confButt',
    state: { button: 'waiting' },
    reducers: {
      maybeSubmit: (action, state) => bin.log(action) || ({button: 'confirm'}),
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
```

The Submission component:

```typescript
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
```

### Wrapping up

blaaa bla bla!
