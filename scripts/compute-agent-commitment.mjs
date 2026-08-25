import { hash } from "starknet";

const value = 42n;
const nonce = 20260826n;
console.log(hash.computePoseidonHashOnElements([value, nonce]));
