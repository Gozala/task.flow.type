// @flow

export interface Task<+x, +a> {
  spawn<id>(Thread): Future<x, a>;

  map<b>((a) => b): Task<x, b>;
  chain<b>((a) => Task<x, b>): Task<x, b>;
  capture<y>((x) => Task<y, a>): Task<y, a>;
  recover((x) => a): Task<empty, a>;
  format<y>((x) => y): Task<y, a>;
  select(Task<x, a>): Task<x, a>;
  couple<b>(Task<x, b>): Task<x, [a, b]>;
}

export interface Future<+x, +a> {
  poll(): Poll<x, a>;
  abort(): void;
}

export type Park = number

export interface Thread {
  park(): Park;
  unpark(Park): void;
}

export type Fail<x> = {
  isOk: false,
  error: x
}

export type Succeed<a> = {
  isOk: true,
  value: a
}

export type Wait = void | null

export type Poll<x, a> = Wait | Fail<x> | Succeed<a>
