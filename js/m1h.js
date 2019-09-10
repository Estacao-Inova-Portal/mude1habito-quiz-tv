// Global variables

// PAGE CONTENT
//
// expected: String
// 'all' = any content type / no filter;
// 'balance' = contents about balance and mental health;
// 'movement' = contents about phisical activites;
// 'food' = contents about health eating;
let pillar = 'all';

// End of Global Variables --------------------------------------------

// Lazy Load images and videos
// This function is called at the end of this JS file
function lazyload() {
  // Lazy load images
  const elements = Array.prototype.slice.call(document.querySelectorAll('[data-src]'))
  elements.forEach(element => {
    element.dataset.src ? element.src = element.dataset.src : null;
  });

  // Lazy load videos
  if (document.getElementsByTagName('video')) {
    Array.prototype.slice.call(document.getElementsByTagName('video')).forEach(element => {
      element.children[0].dataset.src && element.load()
    });
  }
}

// Classes and components
// QUIZ Class
class Quiz {
  constructor(where) {
    // Quiz scoreboard, the values change based on the users answers
    this.scoreboard = {
      food: 0,
      balance: 0,
      movement: 0,
    }

    this.winner = ''

    // The counter to keep track in which question the user is at the moment
    this.answerCounter = 0

    // The quiz content, fed by the backend API
    this.contentArray = []

    this.images = []

    // The DOM element where the Quiz is going to be printed
    this.where = document.getElementById(where)

    this.parent = document.getElementById('quizContainer')
  }

  // initQuiz is started as a callback from a Google Sheets JSON call.
  // This function gets the JSON value as a parameter and organizes it to be used by the front-end
  initQuiz(content) {
    content.feed.entry.forEach(element => {
      const group = {
        question: element.gsx$pergunta.$t,
        questionImg: element.gsx$imagempergunta.$t,
        answers: [{
          answer: element.gsx$resposta1.$t,
          image: element.gsx$imagem1.$t,
          value: element.gsx$valor1.$t,
        }, {
          answer: element.gsx$resposta2.$t,
          image: element.gsx$imagem2.$t,
          value: element.gsx$valor2.$t,
        }, {
          answer: element.gsx$resposta3.$t,
          image: element.gsx$imagem3.$t,
          value: element.gsx$valor3.$t,
        }, {
          answer: element.gsx$resposta4.$t,
          image: element.gsx$imagem4.$t,
          value: element.gsx$valor4.$t,
        }],
      }
      this.contentArray.push(group)
    });

    this.preload()
    this.printQuiz()
    this.addEvents()
  }

  // Adds event listeners on the Quiz Buttons
  addEvents() {
    for (let i = 0; i < 4; i++) {
      this.where.children[1].children[0].children[i].addEventListener('click', this.click.bind(this))
    }
  }

  //Preloads images
  preload() {
    this.contentArray.forEach(quizElement => {
      let photo = new Image()
      photo.src = 'img/quiz/pictures/' + quizElement.questionImg + '.svg';
      photo.alt = 'Imagem representando a pergunta do quiz';
      this.images.push(photo)
    });
  }

  // The function that writes and rewrites the Quiz on the user browser
  printQuiz() {
    const questionArea = {
      image: this.contentArray[this.answerCounter].questionImg,
      question: this.contentArray[this.answerCounter].question,
    }

    const answers = [];
    this.contentArray[this.answerCounter].answers.forEach(element => {
      const group = {
        answer: element.answer,
        image: element.image,
        value: element.value,
      }
      answers.push(group)
    });

    // Writes the question
    this.where.children[1].children[1].firstChild.remove();
    this.where.children[1].children[1].appendChild(this.images[this.answerCounter]);
    this.where.children[0].children[1].innerText = questionArea.question;
    document.getElementById('quizTotal').innerText = this.contentArray.length;
    document.getElementById('quizActual').innerText = this.answerCounter + 1;

    // Writes the answers
    for (let i = 0; i < answers.length; i++) {
      this.where.children[1].children[0].children[i].innerHTML = '<strong>' + answers[i].answer + '</strong>';
      this.where.children[1].children[0].children[i].value = answers[i].value;
    }

  }

  // This function is called when one of the quiz buttons is pressed
  click(event) {
    // Changes scoreboard
    event.target.value ? this.scoreboard[event.target.value]++ : null;

    // Updates counter
    this.answerCounter += 1;

    // If that is still questions to be printed,
    // prints next question, else
    // captures lead
    this.answerCounter !== this.contentArray.length ? this.printQuiz() : this.leadGenerator();

    // Gets the focus out of the button
    event.target.blur()
  }

  // this function creates the HTML node that captures the leads
  leadGenerator() {
    this.where.innerHTML = '<div class="quiz__result">' +
      '<form id="quizForm" class="grid--ideal-type">' +
      '<h1>Estamos quase lá!</h1>' +
      '<p class="text--big">Para acessar o seu resultado, gostaríamos de ter acesso ao seu e-mail.</p>' +
      '<label for="emailQuiz">Insira o seu e-mail aqui</label>' +
      '<input name="emailQuiz" id="emailQuiz" type="email" placeholder="Ex: joao@mude1habito.com.br" required>' +
      '<div class="form__multiple-choice">' +
      '<input required type="checkbox" id="optIn">' +
      '<label for="optIn">Concordo com os <a href="/termos-de-uso" target="_blank">termo de uso</a></label>' +
      '</div>' +
      '<input disabled class="btn--secondary-color-lime" type="submit" id="quizResultBtn" value="Ver o resultado do quiz" />' +
      '</form>' +
      '</div>';

    const optInInput = document.getElementById('optIn');
    const quizBtn = document.getElementById('quizResultBtn');
    optInInput.addEventListener('change', (e) => { e.target.checked === true ? quizBtn.disabled = false : quizBtn.disabled = true })

    this.parent.scrollIntoView();

    // Adds event listeners on the Form
    document.getElementById('quizForm').addEventListener('submit', this.leadCapture.bind(this))
    this.defineWinner()
  }

  // This function captures the lead
  leadCapture(event) {
    event.preventDefault();

    const userdata = {
      email: event.srcElement[0].value,
      food: this.scoreboard.food,
      balance: this.scoreboard.balance,
      movement: this.scoreboard.movement,
      pillar: this.winner,
    }

    // Parses user data to be sent to the backend
    let url = '?'
    Object.keys(userdata).forEach(element => {
      url += element + '=' + userdata[element] + '&';
    });

    // Sends data to backend
    const req = new XMLHttpRequest()
    req.open('GET', 'https://script.google.com/a/portalunimed.com.br/macros/s/AKfycbz8e_4lkt-Ha2uZCsMM3hSxz5MXXNGgAn8MYdhSFg/exec' + url)
    req.send()

    // Shows the Quiz result to the user
    this.results()
  }

  defineWinner() {
    // Compare the results to show the winning habit
    for (let i = 0; i < Object.keys(this.scoreboard).length; i++) {
      let value = Object.keys(this.scoreboard)[i]
      let preData = this.scoreboard[this.winner];

      this.winner ? null : preData = 0;
      this.scoreboard[value] > preData ? this.winner = value : null;
    }

    //Updates the content global variable (other classes uses it, such as the Content/News class)
    pillar = this.winner;
  }

  results() {
    // Define the habits name, description and image file location
    let contents = {
      name: '',
      simpleName: '',
      descripition: '',
      image: '',
    }
    switch (this.winner) {
      case 'food':
        contents.name = 'Ter uma alimentação Saudável'
        contents.simpleName = 'alimentacao'
        contents.description = 'Comer bem é uma das melhores maneiras de garantir qualidade de vida. Faz nosso corpo funcionar de forma adequada e também ajuda na prevenção de doenças. Sua alimentação deve ser balanceada, contendo proteínas, carboidratos, vitaminas, gorduras, fibras, água e sais minerais. Evite o excesso de sal, açúcar, gorduras e prefira alimentos in natura.'
        break;
      case 'balance':
        contents.name = 'Buscar equilíbrio emocional'
        contents.simpleName = 'equilibrio'
        contents.description = 'O equilíbrio — emocional e mental — é um fator importante para a sua saúde e qualidade de vida. Técnicas de foco e relaxamento podem trazer calma, bem-estar e aumento da autoestima, ajudando você a tomar decisões melhores e a fugir do estresse e da ansiedade.'
        break;
      case 'movement':
        contents.name = 'Movimentar-se e praticar exercícios'
        contents.simpleName = 'movimento'
        contents.description = 'A prática de exercícios físicos regulares é primordial para garantir saúde e qualidade de vida. Faz a sua circulação e seu sistema imunológico funcionarem de forma adequada, além de ajudar na prevenção da obesidade, problemas ósseos e diversas outras doenças.'
        break;
    }

    this.where.classList.add('flex');

    this.where.innerHTML = '<div class="quiz__result">' +
      '<span class="explanation text--big">O hábito que você deve focar em melhorar é:</span>' +
      '<h1>' + contents.name + '</h1>' +
      '<p class="text--big">' + contents.description + '</p>' +
      '<h2>Próximos passos</h2>' +
      '<p class="text--big">Fique tranquilo. A gente te ajuda! Conheça agora o aplicativo Mude1Hábito, a central de saúde e bem-estar que vai te ajudar na jornada de mudanças de hábitos.</p>' +
      '</div>' +
      '<img src="img/quiz/pictures/' + contents.simpleName + '.svg" class="quiz__result-img" alt="Imagem representando ' + contents.name + '">';

    this.parent.scrollIntoView();
  }
}

// Creates the quiz
const theQuiz = new Quiz('quizInterface')
// End of Classes and components -----------------------------------------------------

// Calls google pages APIs
// This function is called at the end of this JS file
function callAPIs() {
  const req = new XMLHttpRequest()
  req.open('GET', 'https://spreadsheets.google.com/feeds/list/1mpU_yd-BIHLQdZtMUhLCeaBXENYbPEPQt3BY7s0-1AQ/1/public/values?alt=json')
  req.send()
  req.onload = function () {
    req.response && theQuiz.initQuiz(JSON.parse(req.response))
  }
}

window.addEventListener('DOMContentLoaded', callAPIs());
window.addEventListener('load', lazyload());