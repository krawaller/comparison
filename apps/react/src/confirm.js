import React from 'react'

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

export default Confirm