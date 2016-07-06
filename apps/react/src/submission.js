import React from 'react'
import Confirm from './confirm'

let Submission = React.createClass({
  getInitialState: ()=> ({submission:'',field:''}),
  onConfirm() { this.setState({submission:this.state.field, field:''}) },
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

export default Submission