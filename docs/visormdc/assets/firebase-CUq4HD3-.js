import{r as o,i,g as r}from"./index.esm-4MavMPwD.js";var s="firebase",t="12.18.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */o(s,t,"app");const a={apiKey:"",authDomain:"",projectId:"",storageBucket:"",messagingSenderId:"",appId:""},n=Object.values(a).every(Boolean),e=n?i(a):null,l=e?r(e):null;n||console.warn("Firebase sin configurar: faltan variables VITE_FIREBASE_* en .env.local. La aplicacion funciona igualmente; solo se desactiva lo que dependa de Firestore.");export{e as app,l as db};
