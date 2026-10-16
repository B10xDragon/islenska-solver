import {checkButton} from './button-check.mjs';
await checkButton({viewport:{width:768,height:1024}});
await checkButton({viewport:{width:1024,height:768}});
await checkButton({viewport:{width:768,height:1024},fallback:true});
