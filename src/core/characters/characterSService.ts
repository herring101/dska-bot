// src/core/characters/characterService.ts

export type CharacterId = "reina" | "saeki" | "kujo" | "tsukishiro";

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  defaultPressureLevel: number;
  // プレッシャー文言や祝福文言など
}

export class CharacterService {
  private characters: Record<CharacterId, CharacterProfile> = {
    reina: {
      id: "reina",
      name: "完璧主義お嬢様 レイナ",
      defaultPressureLevel: 3,
    },
    saeki: {
      id: "saeki",
      name: "フリーランス先輩 佐伯",
      defaultPressureLevel: 4,
    },
    kujo: {
      id: "kujo",
      name: "闇プロジェクトマネージャー 九条",
      defaultPressureLevel: 5,
    },
    tsukishiro: {
      id: "tsukishiro",
      name: "メンタリスト 月城",
      defaultPressureLevel: 3,
    },
  };

  getCharacterProfile(id: CharacterId): CharacterProfile {
    return this.characters[id];
  }

  // キャラクターごとの文言管理、プレッシャーレベルの計算など
}
