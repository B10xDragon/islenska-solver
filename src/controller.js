import {placeMove} from './board.js';
export function applySolution(state,result){state.bestMove=result.bestMove;state.placed=false;if(state.autoPlace&&state.bestMove)placeBest(state);return state;}
export function placeBest(state){if(state.placed)throw Error('Move already placed.');const next=placeMove(state.board,state.rack,state.bestMove);Object.assign(state,next,{placed:true});return state;}
