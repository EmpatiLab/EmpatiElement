import EEBase, { Constructor } from "../Particles";
import { Stages } from "./StageParticle";

export class MinimalProperty extends PropertyParticle(EEBase){};

export default function PropertyParticle<TBase extends Constructor<EEBase>>(Ctor: TBase){
  return class PropertyParticleP extends Ctor {
    static PropertySet: string[];
    static AttributeSet: string[];
    protected Properties = {} as Record<string, any>;

    static get observedAttributes(): string[] {
      return (this.prototype as any).observedAttributes;
    }

    constructor(...args: any[]) {
      super(...args);
      if ("PropertySet" in this.Proto)
        (this.Proto as typeof PropertyParticleP).PropertySet.forEach(x =>
          this.$RegisterProperty(x)
        );
      if ("AttributeSet" in this.Proto)
        (this.Proto as typeof PropertyParticleP).AttributeSet.forEach(x =>
          this.$RegisterProperty(x, true)
        );
      for (
        let Key: { name: string; value: string } = this.attributes[0], i = 0;
        i < this.attributes.length;
        Key = this.attributes[i++]
      )
        if (Key)
          if (
            ("PropertySet" in this.Proto &&
              Key.name in this.Proto.PropertySet) ||
            ("AttributeSet" in this.Proto &&
              Key.name in this.Proto.AttributeSet)
          )
            this.Properties[Key.name] = Key.value;
          else (this as any)[Key.name] = Key.value;
    }

    private $RegisterProperty(Key: string, Attribute = false) {
      const IfFilter = `CanChange${Key}` in this.Proto;
      Object.defineProperty(this, Key, {
        get() {
          return Attribute ? this.getAttribute(Key) : this.Properties[Key];
        },
        set(Value: any) {
          if (
            this.Properties[Key] === Value ||
            (IfFilter &&
              !(this.Proto as any)[`CanChange${Key}`].call(
                this,
                Value,
                this.Properties[Key]
              ))
          )
            return;
          this.Properties[Key] = Value;
          if (Attribute && this.$Stage !== Stages.Constr)
            this.setAttribute(Key, Value);
          if (this.$Stage === Stages.Idle) {
            this.$Stage = Stages.NeedsUpdate;
            this.$Update();
          } else this.$BatchedWorkOnQueue = true;
        }
      });
    }
  };
}