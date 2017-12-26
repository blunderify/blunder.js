interface FuncWrapper {
  (): any;
  inner: () => any;
  _blunder?: boolean;
}

export default FuncWrapper;
