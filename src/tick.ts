import { useReducer } from "react";
import { _arr_delete } from "./utils";

let _T = 0;

const reducer = () => _T++;

export const useTick = () => {
  const [, tick] = useReducer(reducer, _T, reducer);
  return tick;
};