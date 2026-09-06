import type { Schema, Struct } from '@strapi/strapi';

export interface BoosterDropRate extends Struct.ComponentSchema {
  collectionName: 'components_booster_drop_rates';
  info: {
    displayName: 'Drop rate';
    icon: 'percent';
  };
  attributes: {
    probabilityPercent: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      >;
    rarity: Schema.Attribute.Enumeration<
      ['common', 'rare', 'epic', 'legendary', 'joker']
    > &
      Schema.Attribute.Required;
    signed: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'booster.drop-rate': BoosterDropRate;
    }
  }
}
