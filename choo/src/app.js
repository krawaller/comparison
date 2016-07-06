import choo from 'choo'
import Submission from './submission'

const app = choo()

app.router((route) => [route('/', Submission(app))])

document.body.appendChild(app.start())