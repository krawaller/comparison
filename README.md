### The premise

In this post we will compare how loosely coupled composition is done in [React]() [Angular2]() [Choo]() and [Cycle](). The setup is similar to the TodoMVC project, meaning we will implement the same application in all frameworks. Our app is however much smaller in scope than TodoMVC, and focused on the aspect of composition.

### The application

The example application is a simple submission form. The flow is like thus:

1. Enter text in the field
2. Click submit (and then comfirm)
3. The latest submitted text is shown below the field.

Try it out below!

IFRAME

The application is made up by two components - a child `Confirm` button, which is then used by the parent `Submission` component making up the form.

The `Confirm` button has three different modes, which should be tracked in an internal **status** state:

* Showing `Submit` but greyed out ("disabled")
* Showing `Submit` ("waiting")
* Showing `Cancel` and `Confirm`. ("confirm")

Meanwhile the `Submission` component holds the current content of the **field**, as well as the latest **submission**.

The `Submission` component needs to tell `Confirm` whether it is **disabled** (since `Confirm` doesn't know the contents of the field). `Submission` also listens for **submit** events from `Confirm`, to know when a submission is made.

The state and communication can be expressed through the following diagram:

![overview](img/overview.svg)

We will now implement these two components in all four frameworks, and then discuss the comparison.

### React implementation

First out - React! You can find a webpackbin with the app running [here](http://www.webpackbin.com/Ey70dIVI-).

React's model is very simple - everything is made up by **components**, whose UI are the results of their internal **state** and the **properties** passed from the parent.

![overview](img/reactcomp.svg)

A parent talks to the child by passing props. If a child needs to be able to answer, we pass a *callback* prop which the child should call at the appropriate time.

![overview](img/reactcommunication.svg)

If we need more app-wide communication we might want to use something like [Redux](http://redux.js.org/) instead.

#### The `Confirm` component in React

```typescript
let Confirm = React.createClass({
  getInitialState: ()=> ({status:'waiting'}),
  maybe() { this.setState({status:'confirm'}) },
  changedmymind() { this.setState({status:'waiting'}) },
  yesimsure() {
    this.props.confirm();
    this.setState({status:'waiting'})
  },
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

There's not much to note here. The `status` of the button is kept in state, while whether or not we're `disabled` is received as a prop from the parent. We also receive a `props.confirm` callback, which we call when the user confirms their submission.

#### The `Submission` component in React

```typescript
let Submission = React.createClass({
  getInitialState: ()=> ({submission:'',field:''}),
  onConfirm() { this.setState({submission:this.state.field,field:''}) },
  onChange(e) { this.setState({field:e.target.value}) },
  render() { return (
    <div>
      <input value={this.state.field} onChange={this.onChange}/>
      <Confirm disabled={!this.state.field} confirm={this.onConfirm}/>
      <p>Submitted value: {this.state.submission}</p>
    </div>
  )}
})
```

We can see that `submission` and `field` is explicitly kept in state. We pass `disabled` and an `onConfirm` handler to the child.

Note that we could opt to store `field` in the DOM node and read it in the `onConfirm` handler using a [ref](https://facebook.github.io/react/docs/more-about-refs.html). This however isn't considered as idiomatic. See more [here](https://facebook.github.io/react/docs/forms.html#uncontrolled-components).

### Angular2 implementation

Now for the Angular2 implementation, which you can get in a webpackbin [here](http://www.webpackbin.com/VkPFPSXL-). Unlike it's predecessor, Angular2 is made up by composable components much like React.

A component is made up by a decorator call containing template and other metadata, and a class for holding state and methods. Inputs and outputs are explicitly declared in these classes.

#### The `Confirm` component in Angular2

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

The button status is stored in a `state` property in the class. We see that `disabled` is defined as a boolean `Input`, and that `confirm` is an EventEmitter `Output`. Angular2 uses [RxJS](http://reactivex.io/) streams for this.


#### The `Submission` component in Angular2

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

Here we attach an `onConfirm` listener to the `confirm` output from the child component. Note that we don't store the `field` value in state, we leave this to the DOM and simply collect it when we need it using `ViewChild`.

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
