import { defineStore } from 'pinia'; import * as championData from '@/assets/champion.json'; import * as itemData from '@/assets/item.json'
const uselessItems = [1035, 1039, 1040, 1500, 1501, 1502, 1503, 1504, 1505, 1506, 1507, 1508, 1509, 1510, 1511, 1512, 1513, 1514, 1515, 1516, 1517, 1518, 1519, 2003, 2010, 2031, 2033, 2052, 2055, 2138, 2139, 2140, 2403, 2419, 2420, 2421, 2423, 2424, 3330, 3340, 3363, 3364, 3400, 3513, 3599, 3600, 3901, 3902, 3903, 4403, 4638, 4643, 7050]
const Ornnaments = [7000, 7001, 7002, 7003, 7004, 7005, 7006, 7007, 7008, 7009, 7010, 7011, 7012, 7013, 7014, 7015, 7016, 7017, 7018, 7019, 7020, 7021, 7022, 7023, 7024]
const armorPenItems = [
   {id: "3035", percentage: 0.18, lethality: 0}, // last whisper
   {id: "3036", percentage: 0.3, lethality: 0},// lord dominik's regards
   {id: "3134", percentage: 0, lethality: 10},  // serrated dirk
   {id: "3142", percentage: 0, lethality: 18},  // youmuu's ghostblade
   {id: "3179", percentage: 0, lethality: 10},  // umbral glaive
   {id: "3814", percentage: 0, lethality: 10},  // edge of night
   {id: "6676", percentage: 0, lethality: 12},  // collector
   {id: "6691", percentage: 0, lethality: 18},  // duskblade of draktharr
   {id: "6692", percentage: 0, lethality: 18},  // eclipse
   {id: "6693", percentage: 0, lethality: 18},  // prowler's claw
   {id: "6694", percentage: 0.3, lethality: 0}, // serylda's grudge
   {id: "6695", percentage: 0, lethality: 12},   // serpent's fang
   {id: "6696", percentage: 0, lethality: 10}   // axiom arc
]
const magicPenItems = [
   {id: "3020", percentage: 0, flat: 18},  // sorcerer's shoes
   {id: "3135", percentage: 0.4, flat: 0},  // void staff
   {id: "3152", percentage: 0, flat: 6},  // hextech rocketbelt
   {id: "4630", percentage: 0.13, flat: 0},  // blighting jewel
   {id: "6655", percentage: 0, flat: 6},  // luden's echo
]
armorPenItems.forEach(item => {
   const newKey = item.percentage != 0 ? "PercentageArmorPenetrationMod" : "FlatArmorPenetrationMod"
   itemData.data[item.id].stats[newKey] = item.percentage != 0 ? item.percentage : item.lethality
})
magicPenItems.forEach(item => {
   const newKey = item.percentage != 0 ? "PercentageMagicPenetrationMod" : "FlatMagicPenetrationMod"
   itemData.data[item.id].stats[newKey] = item.percentage != 0 ? item.percentage : item.flat
})
uselessItems.forEach(id => {delete itemData.data[id]})
Ornnaments.forEach(id => {delete itemData.data[id]})

export const useMainStore = defineStore({
   id: 'counter',
   state: () => ({
      patch: '12.18.1',
      champions: championData.data,
      allItems: itemData.data,
      mythics: ["6693", "6692", "6691", "6673", "6672", "6671", "6664", "6662", "6656", "6655", "6653", "6632", "6631", "6630", "6617", "6616", "4644", "4636", "4633", "4005", "3190", "3152", "3078", "3068", "3001", "2065"],
      adaptiveForceBias: {
         attackDamage: ["Aatrox", "Akshan", "Aphelios", "Ashe", "Belveth", "Blitzcrank", "Braum", "Caitlyn", "Camille", "Corki", "Darius", "Draven", "DrMundo", "Ezreal", "Fiora", "Gangplank", "Garen", "Gnar", "Graves", "Hecarim", "Illaoi", "Irelia", "JarvanIV", "Jax", "Jayce", "Jhin", "Jinx", "Kaisa", "Kalista", "Kayle", "Kayn", "Khazix", "Kindred", "Kled", "KogMaw", "LeeSin", "Leona", "Lucian", "MasterYi", "MissFortune", "MonkeyKing", "Nasus", "Nocturne", "Olaf", "Ornn", "Pantheon", "Poppy", "Pyke", "Qiyana", "Quinn", "Rammus", "RekSai", "Rell", "Renekton", "Rengar", "Riven", "Samira", "Senna", "Sett", "Shaco", "Shen", "Shyvana", "Sion", "Sivir", "Skarner", "TahmKench", "Talon", "Taric", "Thresh", "Tristana", "Trundle", "Tryndamere", "Twitch", "Udyr", "Urgot", "Varus", "Vayne", "Vi", "Viego", "Volibear", "Warwick", "Xayah", "XinZhao", "Yasuo", "Yone", "Yorick", "Zed", "Zeri"],
         abilityPower: ["Ahri", "Akali", "Alistar", "Amumu", "Anivia", "Annie", "AurelionSol", "Azir", "Bard", "Brand", "Cassiopeia", "Chogath", "Diana", "Ekko", "Elise", "Evelynn", "Fiddlesticks", "Fizz", "Galio", "Gragas", "Gwen", "Heimerdinger", "Ivern", "Janna", "Karma", "Karthus", "Kassadin", "Katarina", "Kennen", "Leblanc", "Lillia", "Lissandra", "Lulu", "Lux", "Malphite", "Malzahar", "Maokai", "Mordekaiser", "Morgana", "Nami", "Nautilus", "Neeko", "Nidalee", "Nunu", "Orianna", "Rakan", "Renata", "Rumble", "Ryze", "Sejuani", "Seraphine", "Singed", "Sona", "Soraka", "Swain", "Sylas", "Syndra", "Taliyah", "Teemo", "TwistedFate", "Veigar", "Velkoz", "Vex", "Viktor", "Vladimir", "Xerath", "Yuumi", "Zac", "Ziggs", "Zilean", "Zoe", "Zyra"]
      },
      passives: [
         {id: "1043", description: "15 bonus physical damage on-hit."}, // recurve bow
         {id: "3001", description: "5 bonus armor and 5 bonus magic resists per other legendary item."}, // evenshroud
         // {id: "3003", description: "bonus ability power equal to 3% maximum mana."}, // archangel's staff
         {id: "3004", description: "bonus attack damage equal to 2.5% maximum mana."}, // manamune
         {id: "3031", description: "bonus 35% critical strike damage if you have at least 60% crit chance."}, // infinity edge
         {id: "3036", description: "deal 0-15% bonus attack damage depending on maximum health difference."},  // lord dominik's regards
         // {id: "3040", description: "bonus ability power equal to 5% maximum mana."}, // seraph's embrace
         {id: "3041", description: "+125 ability power (fully stacked)."}, // mejai
         {id: "3042", description: "bonus attack damage equal to 2.5% maximum mana. Basic attacks deal 1.5% maximum mana bonus physical damage on-hit."}, // muramana
         {id: "3047", description: "reduces damage from basic attacks by 12%."}, // plated steelcaps
         {id: "3053", description: "+45% base attack damage as bonus attack damage."}, // sterak's gage
         {id: "3068", description: "+50 health per other legendary item."},   // sunfire aegis
         {id: "3078", description: "3 bonus attack damage per other legendary item."}, // trinity force
         {id: "3089", description: "increases ability power by 35%."}, // rabadon's deathcap
         {id: "3091", description: "15-80 bonus magic damage on hit based on level."}, // wit's end
         {id: "3115", description: "15 + 20% ap bonus magic damage on hit."}, // nashor's tooth
         {id: "3119", description: "bonus health equal to 8% maximum mana."}, // winter's approach
         {id: "3121", description: "bonus health equal to 8% maximum mana."}, // fimbul winter
         {id: "3124", description: "40 bonus physical damage on-hit per 20% critical strike chance."}, // guinsoo's rageblade
         {id: "3748", description: "bonus attack damage equal to 2% bonus health. Deal bonus physical damage on hit based on maximum hp."}, // titanic hydra
         {id: "4005", description: "+15 ability power per other legendary item."}, // imperial mandate
         {id: "4633", description: "+8 ability power per other legendary item."}, // riftmaker
         {id: "4637", description: "bonus ability power equal to 2% bonus health."}, // demonic embrace
         {id: "4644", description: "+8 ability power per other legendary item."}, // crown of the shattered queen
         {id: "6632", description: "+3% armor penetration and magic penetration per other legendary item."}, // divine sunderer
         {id: "6656", description: "+10 ability power per other legendary item."}, // everfrost
         {id: "6662", description: "+100 health per other legendary item."},   // frostfire gauntlet
         {id: "6664", description: "+50 health per other legendary item."},   // turbo chemtank
         {id: "6672", description: "+10% bonus attack speed per other legendary item."},  // kraken slayer
         {id: "6673", description: "+5 attack damage, +70 health per other legendary item."},   // immortal shieldbow
         {id: "6677", description: "35 bonus physical damage on-hit per 20% critical strike chance."},   // rageclaw
         {id: "6692", description: "+4% armor penetration per other legendary item."}, // eclipse
         {id: "6693", description: "+5 lethality per other legendary item."}, // prowler's claw
      ],
      asRatioChampions: [  // https://leagueoflegends.fandom.com/wiki/List_of_champions/Attack_speed | AS Ratio / Base
         ["Akshan", 0.6269592476489028],
         ["Amumu", 0.8668478260869565],
         ["Caitlyn", 0.8340675477239354],
         ["DrMundo", 0.8680555555555556],
         ["Ekko", 0.9084302325581395],
         ["Gangplank", 1.048632218844985],
         ["Gragas", 0.9259259259259259],
         ["Graves", 1.031578947368421],
         ["Jhin", 0],
         ["Kayle", 1.0672],
         ["Kennen", 1.104],
         ["Lissandra", 0.9527439024390244],
         ["Lux", 0.9342301943198804],
         ["Malphite", 0.8668478260869565],
         ["Maokai", 0.86875],
         ["Nautilus", 0.8668555240793201],
         ["Neeko", 1.072],
         ["Nocturne", 0.9264909847434119],
         ["Qiyana", 0.9084302325581395],
         ["Rammus", 0.9527439024390244],
         ["Sejuani", 0.9084302325581395],
         ["Senna", 0.48],
         ["Seraphine", 0.9342301943198804],
         ["Shen", 0.866844207723036],
         ["Tristana", 1.035060975609756],
         ["Vex", 0.9342301943198804],
         ["Volibear", 1.12],
         ["Wukong", 0.9254571026722925],
         ["Yasuo", 0.9612625538020086],
         ["Zac", 0.836173001310616],
      ],
      mainChampion: undefined,
      mainItems: [],
      mainLevel: 1,
      targetChampion: undefined,
      targetItems: [],
      targetLevel: 1,
      championStats: {
         main: {},
         target: {}
      },
      showModeTooltips: true,
      itemGroupsCheck: true,
      apVisibility: false,
      itemStatsVisibility: true
   }),
   getters: {
      getChampion: (state) => (champion) => {
         return state.champions[champion]
      },
      getMainChampion(){
         return this.champions[this.mainChampion]
      },
      getTargetChampion(){
         if(this.targetChampion === 'targetDummy'){
            return 'targetDummy'
         }
         return this.champions[this.targetChampion]
      },
      getSelectedItems: (state) => (isMain) => {
         return isMain ? state.mainItems : state.targetItems
      },
      getLevel: (state) => (isMain) => {
         return isMain ? state.mainLevel : state.targetLevel
      },
      getItem: (state) => (item) => {
         return state.allItems[item]
      },
      getCalculatedStats: (state) => (isMain) => {
         return isMain ? state.championStats.main : state.championStats.target
      }
   },
   actions: {
      setMainChampion(payload){
         this.mainChampion = payload.champion
      },
      setTargetChampion(payload){
         this.targetChampion = payload.champion
      },
      setItems(payload){
         if(payload.isMain){
            this.mainItems = payload.items
         } else{
            this.targetItems = payload.items
         }
      },
      setLevel(payload){
         if(payload.isMain){
            this.mainLevel = payload.level
         } else{
            this.targetLevel = payload.level
         }
      },
      setCalculatedStats(payload){
         if(payload.isMain){
            this.championStats.main = payload.stats
         } else{
            this.championStats.target = payload.stats
         }
      },
      setShowModeTooltips(payload){
         localStorage.setItem('tooltipsVisibility', payload)
         this.showModeTooltips = (payload == 'false' || payload == false) ? false : true
      },
      setItemGroupsCheck(){
         this.itemGroupsCheck = !this.itemGroupsCheck
      },
      setApVisibility(){
         this.apVisibility = !this.apVisibility
      },
      setItemStatsVisibility(){
         this.itemStatsVisibility = !this.itemStatsVisibility
      }
   }
})
