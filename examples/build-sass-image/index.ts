import styles from './styles/style.scss';
import another, { code as anothercode } from './styles/anotherstyle.module.scss';
import image from './assets/bunlogo.svg';
console.log('Code loaded:\n' + anothercode);
console.log('Styles loaded:\n' + styles, image);
console.log('Another Styles loaded:\n',another);
