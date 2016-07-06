import xs from 'xstream'
import {run} from '@cycle/xstream-run'
import {makeDOMDriver} from '@cycle/dom'

import submission from './submission'

run(submission, { DOM: makeDOMDriver('#app') });