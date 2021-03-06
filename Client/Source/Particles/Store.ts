import EmpatiElement, { RegisterParticle, ParticleBase } from "../Element";

export function Store(Selector: string, Reactive = true){
  return function<T extends EmpatiElement>(Target: T, Key: Extract<keyof T, string>) {
    RegisterParticle(StoreParticle, Target);
    (Target.Particles.StoreParticle as StoreParticle).Queries.push([Key, Selector, Reactive]);
  } 
}

declare global {
  interface Window { Storage: Record<string, any> }
}



const Storage: Record<string, any> = window.Storage = {};
const Targets: Record<string, EmpatiElement[]> = {};

class StoreParticle extends ParticleBase {

  Queries: Array<[string, string, boolean]> = [];

  BeforeConstr(Target: EmpatiElement){
    this.Queries.forEach(this.DefineProperty.bind(this, Target));
  }

  private DefineProperty(this: StoreParticle, Target: EmpatiElement,
    Data: [string, string, boolean]){
    const Old = (Target as any)[Data[0]];
    if(Old) Storage[Data[1]] = Old;
    Target.DefineProp(Data[0], () => Storage[Data[1]], (Super, Value) => {
      console.log(Targets);
      const Old = Storage[Data[1]];
      if(Old === Value) return Old;
      Storage[Data[1]] = Value;
      Targets[Data[1]].forEach(x => x.Refresh());
    });
    if(!(Data[1] in Targets)) Targets[Data[1]] = [];
    Targets[Data[1]].push(Target);
  }
}