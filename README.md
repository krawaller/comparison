### The premise

In this post we will compare how loosely coupled composition is done in [React](https://facebook.github.io/react/), [Angular2](https://angular.io), [Choo](https://github.com/yoshuawuyts/choo) and [Cycle](http://cycle.js.org/). The setup is similar to the TodoMVC project, meaning we will **implement the same application in all frameworks**. Our app is however much smaller in scope than TodoMVC, and focused on the aspect of composition.

I (David) wrote this in collaboration with the talented fellow JS-nerd [Mattias](), who wrote the Choo version and got me interested in that framework. I hope to lure him into doing more writing here in the future!

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

We will now implement these two components in all four frameworks, and then discuss the comparison. The main rule will be that `Confirm` should be decoupled enough to be reusable in a completely different app.

### React implementation

First out - React! You can find a Webpackbin with the app running at [http://www.webpackbin.com/Ey70dIVI-](http://www.webpackbin.com/Ey70dIVI-).

React's model is very simple - everything is made up by **components**, whose UI are the results of their internal **state** and the **properties** passed from the parent.

![reactcomp](img/reactcomp.svg)

A parent talks to the child by passing props. If a child needs to be able to answer, we pass a *callback* prop which the child should call at the appropriate time.

![reactcommunication](img/reactcommunication.svg)

If we need more app-wide communication we might want to use something like [Redux](http://redux.js.org/) instead, but that would be overkill for this implementation.

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

The `status` of the button is kept in state, while whether or not we're `disabled` is received as a prop from the parent. We also receive a `props.confirm` callback, which we call when the user confirms their submission.

#### The `Submission` component in React

```typescript
let Submission = React.createClass({
  getInitialState: ()=> ({submission:'',field:''}),
  onConfirm() { this.setState({submission:this.state.field, field:''}) },
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

Note that we could opt to store `field` in the DOM node and read it from the element in the `onConfirm` handler using a [ref](https://facebook.github.io/react/docs/more-about-refs.html). This however isn't considered as idiomatic. See more [here](https://facebook.github.io/react/docs/forms.html#uncontrolled-components).

### Angular2 implementation

Now for the Angular2 implementation, which you can get in a Webpackbin at [http://www.webpackbin.com/VkPFPSXL-](http://www.webpackbin.com/VkPFPSXL-). Unlike it's predecessor, an Angular2 app is made up by composable components much like React.

A component consists of a decorator call containing template and other metadata, and a class for holding state and methods. Inputs and outputs are explicitly declared in these classes.

#### The `Confirm` component in Angular2

```typescript
@Component({
  selector: 'confirm',
  template: `
    <span *ngIf="status !== 'confirm'">
      <button (click)="maybe()" [disabled]="status === 'disabled'">Submit</button>
    </span>
    <span *ngIf="status === 'confirm'">
      <button (click)="changedmymind()">Cancel</button>
      <button (click)="yesimsure()">Confirm</button>
    </span>
  `
})
export class Confirm {
  status: string = 'waiting'
  @Output() confirm = new EventEmitter()
  @Input() set disabled(bool: boolean){
    this.status = bool ? 'disabled' : 'waiting'
  }
  maybe() { this.status = 'confirm' }
  changedmymind() { this.status = 'waiting' }
  yesimsure() { this.confirm.emit(); this.status = 'waiting' }
}
```

The button `status` is stored in a property in the class. We see that `disabled` is defined as a boolean `Input`, to which we apply a setter that toggles `status` accordingly.

The `confirm` action is an EventEmitter `Output`. These are [RxJS](http://reactivex.io/) streams, which the rendering parents can subscribe to.


#### The `Submission` component in Angular2

```typescript
@Component({
  selector: 'submission',
  template: `
    <input #field (input)="0">
    <confirm (confirm)="onConfirm()" [disabled]="!field.value.length"></confirm>
    <p>Submitted value: {{submission}}</p>
  `,
  directives: [Confirm]
})
class Submission {
  @ViewChild('field') input: Control
  field: string
  submission: string
  onConfirm() {
    this.submission = this.input.nativeElement.value
    this.input.nativeElement.value = ''
  }
}
```

Here we attach an `onConfirm` listener to the `confirm` stream output from the child component.

Unlike the React implementation we don't store the `field` value in state, instead we leave this to the DOM and simply collect it when we need it using [`ViewChild`](https://angular.io/docs/ts/latest/api/core/index/ViewChild-var.html).

We don't really need to add the `field` and `submission` props to the class definition since we don't initialize them, but it is good to do it anyway for clarity.

### CycleJS implementation

Of these four frameworks CycleJS is probably the most exotic one. A Cycle app contains no imperative programming and no state machines - everything is just streams! A component receives a bunch of streams as input (called `sources`), and returns another bunch as output (called `sinks`).

We will implement our app following the [Model-View-Intent](http://cycle.js.org/model-view-intent.html) pattern:

![mvi](img/mvi.svg)

1.   A component receives `sources` from the parent or the root renderer
1.   The `intent` function translates these to a stream of `actions`
1.   The `actions` are sent to the `model` function who returns the component `state`
1.   That `state` is given to the `view` function which translates it to **virtual DOM**, often called `vtree`
1.   Finally we return the `vtree` as part of the `sinks`, maybe coupled with other stuff from `actions` and `state` that are of interest to the outside world.

The Webpackbin for this implementation can be found at [http://www.webpackbin.com/NJD02H4L-](http://www.webpackbin.com/NJD02H4L-).

#### The `Confirm` component in CycleJS

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

Note how we assume `disabled$` to exist among `sources`, which needs to be provided by the parent. The `intent` function doesn't separate local and foreign events - we get a stream containing `DISABLE` and `ENABLE` from the parent, jumbled with the local events `MAYBE`, `CANCEL` and `CONFIRM`.

The `model` function returns a single string as state, namely which mode the button is in - `disabled`, `waiting` or `areyousure`.


#### The `Submission` component in CycleJS

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
    case 'INPUT': return {...state, field: action.data}
    case 'SUBMIT': return {submission: action.data, field: ''}
    default: return state
  }
}, {submission:'',field:''} )

const view = (state$,confirmvtree$)=>
  xs.combine(state$,confirmvtree$).map(([state,confirmvtree])=>
    div([
      input('.field', {props:{value: state.field}}),
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

The `withComponent` composition helper is the one introduced in [this post](http://blog.krawaller.se/posts/exploring-composition-in-cyclejs/). The purpose is to help solve the circular dependencies between parent and child sinks and sources, by making child sinks appear in parent sources, and selected parent sources in child sinks (in our case `disabled$`).

The `intent` function picks up two different actions - a local `INPUT` action when the user types in the field, and a `SUBMIT` action bubbling up from the child.

The `model` function derives a state object containing `field` and `submission`, which we recognise from the other implementations.


### Choo implementation

Last but not least, here is the Choo implementation! It is running in a Webpackbin at [http://www.webpackbin.com/4y4Mt94UZ](http://www.webpackbin.com/4y4Mt94UZ).

Choo is a new and tiny framework, but bla bla bla Mattias, go! :D

In Choo it is common to have an app-wide `model`, very similar to Redux' role in React. But according to our self-imposed rules the components should be stand-alone and reusable, and so must contain their own model definitions! We accomplish this by defining the components in constructors which you pass the `app` object to, so each component can register the model parts they need.

A Choo `model` definition consists of `state`, `reducers` to manipulate that state, and `effects` for side effects. The actual component is then just a pure function that receives the application `state`, a `send` method for triggering effects and reducers, and whatever else you want to pass in. The component function returns virtual DOM for rendering.

Note that we are using Choo version `2.3.1`, but `3.0.0` [just came out](https://github.com/yoshuawuyts/choo/blob/master/CHANGELOG.md#300). We'll hopefully take a look at what has changed in an upcoming, all-choo post!

#### The `Confirm` component in Choo

```typescript
const Confirm = (app,confirmevent)=> {
  app.model({
    namespace: 'confButt',
    state: { status: 'waiting' },
    reducers: {
      maybeSubmit: (action, state) => ({status: 'confirm'}),
      cancelSubmit: (action, state) => ({status: 'waiting'})
    },
    effects: {
      confirmSubmit: (action, state, send)=> {
        send('confButt:cancelSubmit')
        send(confirmevent)
      }
    }
  })
  return (state, disabled, send) => state.confButt.status !== 'confirm' 
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

The constructor is given the `app` object, and the name of the event to trigger when the user has confirmed the action (`confirmSubmit`). Our model also defines the local events `maybeSubmit` and `cancelSubmit`. Together these three change the value of the only state variable, `status`, which can be `waiting` or `areyousure`. Whether or not we are disabled is passed as an argument to the renderer.

In a perfect world this component should only be given it's part of the app state, but for that to be possible we must leak the namespace name to the parent.




#### The `Submission` component in Choo

```typescript
const Submission = app => {
  const confirm = Confirm(app,'sub:submit')
  app.model({
    namespace: 'sub',
    state: { field: '', submission: '' },
    reducers: {
      setField: (action, state) => ({ field: action.payload }),
      submit: (action, state) => ({ field: '', submission: state.field })
    }
  })
  return (params, state, send) => {
    const onChangeHandler = e => send('sub:setField', {payload:e.target.value} )
    return choo.view`
      <div>
        <input value=${state.sub.field} oninput=${onChangeHandler} />
        ${confirm(state, !state.sub.field, send)}
        <p>Submitted value: ${state.sub.submission}</p>
      </div>
    `
  }
}
```

The state for `Submission` contains the by now familiar `field` and `submission`. There are only two events, `setField` and `submit`. The latter is given to the child constructor (`sub:submit`) to be triggered from there.


### Comparison

We'll now bounce these implementations off one another, comparing various aspects:

#### Comparing rendering

Although Angular2 is using templates while React expresses the UI inline (here we use JSX), the way they render children are very similar - we express them as elements intermingled with regular DOM elements.

Here we render `Confirm` inside `Submission` in **React**:

```jsx
<div>
  <input value={this.state.field} onChange={this.onChange}/>
  <Confirm disabled={!this.state.field} confirm={this.onConfirm}/>
  <p>Submitted value: {this.state.submission}</p>
</div>
```

And the corresponding lines in **Angular2**:

```typescript
`
<input #field (input)="0">
<confirm (confirm)="onConfirm()" [disabled]="!field.value.length"></confirm>
<p>Submitted value: {{submission}}</p>
`
```

For both React and Angular2, **communication is intimately tied to rendering**. We pass data to the child as we render it.

As expected **CycleJS** is an odd bird. The DOM nodes are method calls (granted, [we could use JSX here](http://cycle.js.org/getting-started.html)), and the child is a stream event.

```
div([
  input('.field', {props:{value: state.field}}),
  confirmvtree,
  p('Submitted value: '+state.submission)
])
```

The setup for the child is somewhere else entirely. Communication is done purely through the circle (or, *cycle*) of streams.

If we look at **Choo** it seems to fall somewhere inbetween CycleJS and the others; we set up the child as we render it, but we do it through an explicit method call:

```
<div>
  <input value=${state.sub.field} oninput=${onChangeHandler} />
  ${confirm(state, !state.sub.field, send)}
  <p>Submitted value: ${state.sub.submission}</p>
</div>
```

Child to parent communication is done through the all-purpose `send` function instead of by specific callbacks/streams as in React/Angular2.


#### Comparing state

In **React**, the state of a component can be seen in the `getInitialState` calls, as well as in the subsequent `this.setState` setter and `this.state` getter calls.

```typescript
// In the Confirm component
getInitialState: ()=> ({status:'waiting'})

// In the Submission component
getInitialState: ()=> ({submission:'',field:''})
```

We could also make the expected props in `Confirm` - the `disabled` boolean and `confirm` callback - more clear by defining them using [`propTypes`](https://facebook.github.io/react/docs/reusable-components.html).

For the **Angular2** components the state variables are directly visible as props on the classes:

```typescript
// In the Confirm component
status: string = 'waiting'
@Input() set disabled(bool: boolean)

// In the Submission component
@ViewChild('field') input: Control
field: string
submission: string
```

What corresponds to *props* in React are simply instance variables prefixed with `@Input`.

In **CycleJS**, a map of the component state can be found in the seed for the `fold` (elsewhere often called `reduce`) call in the `model` method:

```
// In the Confirm component
action$.fold((s,action)=> {
  switch(action){
    // ...cases trunkated...
  }
},'disabled')  // <---- initial state

// In the Submission component
action$.fold((state, action)=> {
  switch(action.type){
    // ...cases trunkated...
  }
}, {submission:'',field:''}) // <---- initial state
```

Since we boil down all outside input from the `intent` function to a single state in the `model` function (which is where the `fold` call is located), `disabled` becomes one of the possible states for the Confirm component.


Finally in **Choo**, the state is explicitly defined inside the object passed to `app.model`:

```
// In the Confirm component
app.model({
  state: { status: 'waiting' },
  // ...other stuff trunkated...
})

// In the Submission component
app.model({
  state: { field: '', submission: '' },
  // ...other stuff trunkated...
})
```

#### Comparing communication

In **React** the communication is defined in the rendering, as we saw. The parent passes data and callbacks, and the child calls the callback.

```typescript
let Submission = React.createClass({
  // ...other stuff trunkated...
  onConfirm() { this.setState({submission:this.state.field,field:''}) },
  render() {
    // passing `this.onConfirm` as `confirm` prop to child
  }
})

let Confirm = React.createClass({
  // ...other stuff trunkated...
  yesimsure() {
    this.props.confirm(); <--- calling the parent
    this.setState({status:'waiting'})
  },
  render() {
    // uses `this.yesimsure` as button clickhandler
  }
})
```

The **Angular2** pattern is very similar, except the child-parent communication is a stream instead of a callback.

```typescript
// Confirm
@Component({
  template: '...' // executes `yesimsure()` on button click
  // ...other stuff trunkated...
})
export class Confirm {
  // ...other stuff trunkated...
  yesimsure() {
    this.confirm.emit();  <--- calling the parent
    this.status = 'waiting'
  }
}

// Submission
@Component({
  template: '...' // registers `onConfirm` as listener to child `confirm` prop
})
class Submission {
  // ...other stuff trunkated...
  onConfirm() {
    this.submission = this.input.nativeElement.value
    this.input.nativeElement.value = ''
  }
}
```

Again, **CycleJS** is just radically different. Input and output is fully contained in the `sources` and `sinks`.

```
const Confirm = sources=> {
  const action$ = intent(sources)  
  const state$ = model(action$)
  const vtree$ = view(state$)
  return {
    DOM: vtree$,
    submit$: action$.filter(i => i === 'CONFIRM')
  }
}

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

Although the full code for the CycleJS version is by far the longest of all versions, all communication is isolated to the component main functions. Here we see that `Confirm` component returns a `submit` stream, which through the `withComponent` call will become part of the `sources` for `Submission`. That same call also passes the returned `disabled` stream from `Submission` into the `sources` for `Confirm`.

![cyclecomm](img/cyclecomm.svg)

Finally, in **Choo** the communication is defined in the `effects` and `reducers` props of the `model` objects.

```
const Confirm = (app,confirmevent)=> {
  app.model({
    // ...other stuff trunkated...
    reducers: {
      maybeSubmit: (action, state) => ({status: 'confirm'}),
      cancelSubmit: (action, state) => ({status: 'waiting'})
    },
    effects: {
      confirmSubmit: (action, state, send)=> {
        send('confButt:cancelSubmit')
        send(confirmevent) // <--- this will be catched by the parent
      }
    }
  })
  return (state, disabled, send) => {
    // uses `send('sub:maybeSubmit/cancelSubmit/confirmSubmit')` as clickhandlers
  }
}

const Submission = app => {
  const confirm = Confirm(app,'sub:submit') // <--- telling child to trigger `sub:submit`
  app.model({
    // ...other stuff trunkated...
    reducers: {
      setField: (action, state) => ({ field: action.payload }),
      submit: (action, state) => ({ field: '', submission: state.field })
    }
  })
  return (params, state, send) => {
    // uses `send('sub:setField') as input changehandler
  }
}
```

As we noted initially, in Choo you would normally work with a single app-wide `app.model` definition, which would make things more explicit but also more tightly coupled. 


### Wrapping up

We hope you've found this comparison useful! Articles like this can easily become shallow click-bait, but at the very least we learned a lot while typing it out.

Looking forward, I (David) am continually smitten with CycleJS, but recognize that it is still... well, impractical, to use it for bigger things. The Choo model is intriguing - it feels like React+Redux, but somehow more explicit and clear. Angular2 feels like a clumsy React, although still way more streamlined than Angular 1. And finally, when we look at these four implementations, I find it hard to not recognize the simplicity of the React model. 

What about you Mattias?


