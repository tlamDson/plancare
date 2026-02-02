import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
//Import user becose most common use cast is req.user = authenticatedUser
import { IUser } from "../features/user/models/User";

//Define a generic interrface that allows for custom parameter types
//T represents the type of the body property. By default,, it is any but you can specifyt a custome type to enfore strcutre on the request body.
//P : Represent sthe type of the params property. By default, it is any, but you can specify a custome type to enfoce structur on the routes parameters
export interface TypedRequest<T = any, P = any> extends Request {
  body: T;
  params: P & ParamsDictionary;
}
export interface UserRequest extends TypedRequest {
  user?: IUser;
}
export interface ErrorResponse {
  error: string;
  message?: string;
  success?: boolean;
}
export interface ClerkAuth {
  userId?: string;
  sessionId?: string;
  actor?: string;
}
// Extend the Express `Request` type to include `auth`
export interface ClerkRequest extends Request {
  auth?: ClerkAuth;
}
export type ControllerFunction = (req: Request, res: Response) => Promise<any>;
