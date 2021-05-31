import { HttpContextToken } from "@angular/common/http";
import { InjectionToken } from "@angular/core";
import { AsyncStorage } from "./storage";

export const CACHE_STORAGE = new HttpContextToken<InjectionToken<AsyncStorage>>(() => null);
