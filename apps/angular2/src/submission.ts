import {Component,ViewChild} from '@angular/core'
import {Confirm} from './confirm.ts'

@Component({
  selector: 'submission',
  template: `
    <input #field (input)="0">
    <confirm (confirm)="onConfirm()" [disabled]="!field.value.length"></confirm>
    <p>Submitted value: {{submission}}</p>
  `,
  directives: [Confirm]
})
export class Submission {
  submission: string
  @ViewChild('field') input: any
  onConfirm() {
    this.submission = this.input.nativeElement.value
    this.input.nativeElement.value = ''
  }
}