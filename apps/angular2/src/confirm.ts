import {Component,Input,Output,EventEmitter} from '@angular/core';

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
  yesimsure() {
    this.confirm.emit();
    this.state = 'waiting'
  }
}