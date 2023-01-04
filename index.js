// ⚡️ Import Styles
import './style.scss';
import feather from 'feather-icons';
import { showNotification } from './modules/showNotification.js';
import axios from 'axios';

// ⚡️ Render Skeleton
document.querySelector('#app').innerHTML = `
<div class='app-container'>
  <div class='drink-water'>
    <h3 class='title'>Drink Water Tracker</h3>

    <form data-form=''>
       <input type='number' name='goal' min='1' max='4' step='1'  placeholder='Goal Liters'>
       <select name='size'>
        <option value=''>Select cup size</option>
        ${[100, 200, 300, 400, 500, 1000].map(i => `<option value='${i}'>${i}ml</option>`).join('')}
       </select>
       <button type='submit'>Submit</button>
    </form>

    <div class='drink-water__content hide' data-container=''>
      <h2 class='h5'>Goal: <span data-goal>0</span> Liters</h2>
      <div class='drink-water__cup drink-water__cup--big'>
        <div class='drink-water__remained' data-remained>
          <span data-liters>1.5L</span>
          <small>Remained</small>
        </div>
        <div class='drink-water__percentage' data-percentage=''></div>
      </div>
      <p class='drink-water__text'>Select how many glasses of water that you have drank</p>
      <ul class='drink-water__cups' data-caps=''></ul>
      <button class='button' data-reset=''>Reset</button>
    </div>
  </div>

  <a class='app-author' href='https://github.com/nagoev-alim' target='_blank'>${feather.icons.github.toSvg()}</a>
</div>
`;

// ⚡️Create Class
class App {
  constructor() {
    this.DOM = {
      form: document.querySelector('[data-form]'),
      goal: document.querySelector('[data-goal]'),
      cups: document.querySelector('[data-caps]'),
      container: document.querySelector('[data-container]'),
      liters: document.querySelector('[data-liters]'),
      percentage: document.querySelector('[data-percentage]'),
      remained: document.querySelector('[data-remained]'),
      btnReset: document.querySelector('[data-reset]'),
    };

    this.PROPS = {
      goalLiters: 0,
      cupSize: 0,
      cupCount: 0,
      config: this.storageGet(),
    };

    this.storageDisplay();
    this.DOM.form.addEventListener('submit', this.onSubmit);
    this.DOM.btnReset.addEventListener('click', this.onReset);
  }

  /**
   * @function onSubmit - Form submit handler
   * @param event
   */
  onSubmit = (event) => {
    event.preventDefault();

    const form = event.target;
    const { goal, size } = Object.fromEntries(new FormData(form).entries());

    if (!goal && goal.trim().length === 0 || !size) {
      showNotification('warning', 'Please fill the fields');
      return;
    }

    this.PROPS.goalLiters = Number(goal);
    this.PROPS.cupSize = Number(size);
    this.PROPS.cupCount = (this.PROPS.goalLiters / this.PROPS.cupSize * 1000).toFixed(0);
    this.PROPS.config = {
      goal: this.PROPS.goalLiters,
      size: this.PROPS.cupSize,
      count: Number(this.PROPS.cupCount),
      cupDisplayHeight: document.querySelector('.drink-water__cup--big').offsetHeight,
      fulledCups: 0,
      totalCups: 0,
    };

    this.renderCups({ goal, size });
    form.reset();
    form.classList.add('hide');
    this.DOM.container.classList.remove('hide');
    this.storageAdd();
  };

  /**
   * @function renderCups - Render cups HTML
   * @param goal
   * @param size
   */
  renderCups({ goal, size }) {
    this.DOM.cups.innerHTML = '';
    this.DOM.goal.textContent = `${this.PROPS.goalLiters}`;
    this.DOM.liters.textContent = `${this.PROPS.goalLiters}L`;

    for (let i = 0; i < this.PROPS.cupCount; i++) {
      const li = document.createElement('li');
      li.classList.add('drink-water__cup');
      li.setAttribute('data-cups-item', '');
      li.innerHTML = `${size} ml`;
      this.DOM.cups.appendChild(li);
    }

    const cups = document.querySelectorAll('[data-cups-item]');

    cups.forEach((cup, idx) => cup.addEventListener('click', () => this.fillCups(idx, cups)));
  }

  /**
   * @function fillCups - Add/Remove class name to cup element
   * @param idx
   * @param cups
   */
  fillCups = (idx, cups) => {
    if (idx === this.PROPS.cupCount && cups[idx].classList.contains('full')) {
      idx--;
    } else if (cups[idx].classList.contains('full') && (cups[idx].nextElementSibling !== null && !cups[idx].nextElementSibling.classList.contains('full'))) {
      idx--;
    }

    cups.forEach((cup, jdx) => jdx <= idx ? cup.classList.add('full') : cup.classList.remove('full'));

    this.PROPS.config = {
      ...this.PROPS.config,
      cupDisplayHeight: document.querySelector('.drink-water__cup--big').offsetHeight,
      fulledCups: document.querySelectorAll('.drink-water__cup.full').length,
      totalCups: document.querySelectorAll('[data-cups-item]').length,
    };

    this.storageAdd();
    this.bigCupHandler();
  };

  /**
   * @function bigCupHandler - Top big cup change handler
   */
  bigCupHandler = () => {
    if (this.PROPS.config.fulledCups === 0) {
      this.DOM.percentage.style.visibility = 'hidden';
      this.DOM.percentage.style.height = '0';
    } else {
      this.DOM.percentage.style.visibility = 'visible';
      this.DOM.percentage.style.height = `${this.PROPS.config.fulledCups / this.PROPS.config.totalCups * this.PROPS.config.cupDisplayHeight}px`;
      this.DOM.percentage.innerText = `${(this.PROPS.config.fulledCups / this.PROPS.config.totalCups * 100).toFixed(1)}%`;
    }

    if ((this.PROPS.config.fulledCups !== 0 && this.PROPS.config.totalCups !== 0) && this.PROPS.config.fulledCups === this.PROPS.config.totalCups) {
      this.DOM.remained.style.visibility = 'hidden';
      this.DOM.remained.style.height = '0';
    } else {
      this.DOM.remained.style.visibility = 'visible';
      this.DOM.liters.innerText = `${(this.PROPS.goalLiters - (this.PROPS.cupSize * this.PROPS.config.fulledCups / 1000)).toFixed(1)}L`;
    }
  };

  /**
   * @function storageGet - Get data from local storage
   * @returns {any}
   */
  storageGet = () => localStorage.getItem('waterConfig') ? JSON.parse(localStorage.getItem('waterConfig')) : {};

  /**
   * @function storageAdd - Add data to local storage
   */
  storageAdd = () => localStorage.setItem('waterConfig', JSON.stringify(this.PROPS.config));

  /**
   * @function storageDisplay - Get and display data from local storage
   */
  storageDisplay = () => {
    if (localStorage.getItem('waterConfig')) {
      this.PROPS.goalLiters = this.PROPS.config.goal;
      this.PROPS.cupSize = this.PROPS.config.size;
      this.PROPS.cupCount = this.PROPS.config.count;

      this.renderCups({ goal: this.PROPS.goalLiters, size: this.PROPS.cupSize });
      this.DOM.form.classList.add('hide');
      this.DOM.container.classList.remove('hide');

      this.bigCupHandler();

      for (let i = 0; i < this.PROPS.config.fulledCups; i++) {
        document.querySelectorAll('[data-cups-item]')[i].classList.add('full');
      }
    }
  };

  /**
   * @function onReset - Reset app
   */
  onReset() {
    localStorage.clear();
    location.reload();
  }
}

// ⚡️Class instance
new App();
