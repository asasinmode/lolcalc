<template>
<main>
   <h3>calculated stats</h3>
   <div class="baseStats centered">
      <div class="baseStatContainer centered" v-for="(stat, name) in filteredStats" :title="tooltipTitles[name] ? tooltipTitles[name] : ''" :key="stat.id">
         <label :class="{tooltipAvailable: tooltipTitles[name]}"><img :src="iconURL(name)">{{name}}</label>
         <div class="baseStat">
            {{stat}}
         </div>
      </div>
   </div>
</main>
</template>

<script>
import { defineComponent } from "vue";
import { mapState, mapActions } from "pinia";
import { useMainStore } from "@/stores";

export default defineComponent({
   name: 'calculatedChampionInfo',
   props: ['isMain'],
   data(){
      return {
         jhinPassiveValues: [0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10, 0.11, 0.12, 0.14, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36, 0.4, 0.44]
      }
   },
   methods: {
      ...mapActions(useMainStore, ["setCalculatedStats"]),
      sumValuesOf(array, statKey){
         array = array.map(item => this.getItem(item))
         return array.length ? array.map(element => element.stats[statKey] ? element.stats[statKey] : 0).reduce((previous, next) => previous + next) : 0
      },
      calculateArmorPen(array){
         const itemsLethality = array.length > 0 ? array.map(item => item.lethality).reduce((previous, next) => previous + next) : 0
         const itemsArmorPen = array.length > 0 ? Math.floor(array.map(item => item.percentage).reduce((previous, next) => previous + next) * 100) : 0
         return [
            itemsLethality + (this.legendaries(true).length * (this.getSelectedItems(true).includes("6693") ? 5 : 0)),
            itemsArmorPen + (this.legendaries(true).length * (this.getSelectedItems(true).includes("6692") ? 4 : 0)) + (this.legendaries(true).length * (this.getSelectedItems(true).includes("6632") ? 5 : 0))
         ]
      },
      calculateMagicPen(array){
         const itemsFlat = array.length > 0 ? array.map(item => item.flat).reduce((previous, next) => previous + next) : 0
         const itemsPercentage = array.length > 0 ? Math.floor(array.map(item => item.percentage).reduce((previous, next) => previous + next) * 100) : 0
         return [
            itemsFlat + (this.legendaries(true).length * ((this.getSelectedItems(true).includes("3152") || this.getSelectedItems(true).includes("6655")) ? 5 : 0)),
            itemsPercentage + (this.legendaries(true).length * (this.getSelectedItems(true).includes("6632") ? 5 : 0))
         ]
      },
      calculateStat(base, level, growth){
         return base + (growth * (level - 1) * (0.7025 + (0.0175 * (level - 1))))
      },
      critChance(items){
         const chance = Math.round(this.sumValuesOf(items, "FlatCritChanceMod") * 100 * ((this.champion.id === "Yasuo" || this.champion.id === "Yone") ? 2.5 : 1))
         return [
            chance < 100 ? chance : 100,        // crit chance
            chance - 100 > 0 ? !(items.includes("3124") || items.includes("6677")) ? chance - 100 : 0 : 0 // crit chance over 100%
         ]
      },
      critDamage(items){
         const damage = 175 + (items.includes("3031") && this.critChance(items)[0] >= 60 ? 35 : 0)  // infinity edge
         return damage * (this.champion.id === "Jhin" ? 0.86 : 1) * ((this.champion.id === "Yasuo" || this.champion.id === "Yone") ? 0.9 : 1)   // jhin, yasuo/yone
      },
      legendaries(isMain){
         return this.getSelectedItems(isMain).filter(item => (!this.mythics.includes(item) && this.getItem(item).gold.total >= 1600) || item === "3112" || item === "2051" || item === "3184" || item === "3177")
      },
      miniRuneAdaptiveForce(championId, bonusAttackDamage, bonusAbilityPower){
         if(bonusAttackDamage === bonusAbilityPower){
            return this.adaptiveForceBias.attackDamage.includes(championId) ? {attackDamage: 5.4, abilityPower: 0} : {attackDamage: 0, abilityPower: 9}
         }
         return bonusAttackDamage > bonusAbilityPower ? {attackDamage: 5.4, abilityPower: 0} : {attackDamage: 0, abilityPower: 9}
      },
      calculateStats(items){
         const calculated = {
            attackDamage: undefined,
            abilityPower: undefined,
            attackSpeed: undefined,
            armorPenetration: undefined,
            magicPenetration: undefined,
            criticalStrike: undefined,
            health: undefined,
            mana: undefined,
            armor: undefined,
            magicResists: undefined
         }
         const miniRuneAttackSpeed = 0.1, miniRuneArmor = 6

         const mythicPassiveHealth = this.legendaries(this.isMain).length * (items.includes("6662") ? 100 : 0) + this.legendaries(this.isMain).length * ((items.includes("6664") || items.includes("3068")) ? 50 : items.includes("6673") ? 70 : 0)  // frostfire gauntlet / sunfire aegis and turbochemtank / immortal shieldbow mythic passives
         const itemsHealth = this.sumValuesOf(items, "FlatHPPoolMod") + mythicPassiveHealth
         const itemsMana = this.champion.partype === "Mana" ? this.sumValuesOf(items, "FlatMPPoolMod") : 0

         const mythicPassiveLethality = this.legendaries(this.isMain).length * (items.includes("6693") ? 5 : 0)
         const finalLethality = this.sumValuesOf(items, "FlatArmorPenetrationMod") + mythicPassiveLethality
         const mythicPassiveArmorPenetration = (this.legendaries(this.isMain).length * (items.includes("6692") ? 4 : 0)) + (this.legendaries(this.isMain).length * (items.includes("6632") ? 5 : 0))
         const finalPercentPhysicalPenetration = (this.sumValuesOf(items, "PercentageArmorPenetrationMod") * 100) + mythicPassiveArmorPenetration

         const mythicPassiveFlatMagicPenetration = this.legendaries(true).length * ((items.includes("3152") || items.includes("6655")) ? 5 : 0)
         const finalFlatMagicPenetration = this.sumValuesOf(items, "FlatMagicPenetrationMod") + mythicPassiveFlatMagicPenetration
         const mythicPassivePercentageMagicPenetration = this.legendaries(true).length * (items.includes("6632") ? 5 : 0)
         const finalPercentMagicPenetration = (this.sumValuesOf(items, "PercentageMagicPenetrationMod") * 100) + mythicPassivePercentageMagicPenetration

         const finalCritChance = this.critChance(items)[0]
         const finalCritDamage = this.critDamage(items)

         const itemsAttackSpeed = this.sumValuesOf(items, "PercentAttackSpeedMod") + this.legendaries(true).length * (items.includes("6672") ? 0.1 : 0)  // all items + kraken slayer mythic passive
         const attackSpeedRatio = (this.asRatioChampions.find(champion => champion[0] == this.champion.id) ? this.asRatioChampions.find(champion => champion[0] == this.champion.id)[1] : 1)
         const finalAttackSpeedArray = this.champion.id === "Jhin" ? Array.from({length: 18}, (_, level) => {return parseFloat((((3 / 100) * level * (0.7025 + (0.0175 * level)) + 1) * this.champion.stats.attackspeed).toFixed(3))}) // jhin is a special cookie
            : Array.from({length: 18}, (_, level) => {
               let attackSpeedFromLevel = (this.champion.stats.attackspeedperlevel / 100) * (level) * (0.7025 + (0.0175 * (level)))
               return parseFloat((this.champion.stats.attackspeed * ((attackSpeedFromLevel + itemsAttackSpeed + miniRuneAttackSpeed) * attackSpeedRatio + 1)).toFixed(3))
            }).map(attackSpeed => (attackSpeed > 2.5 && this.champion.id !== "Belveth") ? 2.5 : attackSpeed)
         
         const mythicPassiveAttackDamage = this.legendaries(true).length * (items.includes("6673") ? 5 : 0) + this.legendaries(true).length * (items.includes("3078") ? 3 : 0) // ad from shieldbow/trinity mythic passive
         const itemsAttackDamage = this.sumValuesOf(items, "FlatPhysicalDamageMod") + mythicPassiveAttackDamage
         
         const dreadAbilityPower = items.includes("3041") ? 125 : 0
         const mythicPassiveAbilityPower = this.legendaries(this.isMain).length * (items.includes("4005") ? 15 : 0) + this.legendaries(this.isMain).length * (items.includes("6656") ? 10 : 0) + this.legendaries(this.isMain).length * (items.includes("4633") ? 8 : 0) // ad from imperial mandate/everfrost/riftmaker mythic passive
         const itemsAbilityPower = this.sumValuesOf(items, "FlatMagicDamageMod") + mythicPassiveAbilityPower + dreadAbilityPower

         const mythicPassiveArmor = this.legendaries(false).length * (items.includes("3001") ? 5 : 0)
         const itemsArmor = this.sumValuesOf(items, "FlatArmorMod") + mythicPassiveArmor
         const mythicPassiveMagicResists = this.legendaries(false).length * (items.includes("3001") ? 5 : 0)
         const itemsMagicResists = this.sumValuesOf(items, "FlatSpellBlockMod") + mythicPassiveMagicResists

         const itemPassiveRabadon = items.includes("3089") ? 1.35 : 1
         
         const championPassiveWindBrothers = (this.champion.id === "Yasuo" || this.champion.id === "Yone") ? this.critChance(items)[1] * 0.4 : 0   // yone/yasuo passive bonus attack damage
         const championPassiveVladimirHealthToAPRatio = this.champion.id === "Vladimir" ? (1 / 30) : 0  // vladimir passive health to ability power ratio
         const championPassiveVladimirAPToHealthRatio = this.champion.id === "Vladimir" ? 1.6 : 0  // vladimir passive ability power to health ratio
         const championPassiveVladimirBonusHealthToApRatio = (this.champion.id === "Vladimir" && items.includes("3089")) ? 0.0188 : 0   // slightly higher number from https://leagueoflegends.fandom.com/wiki/Vladimir/LoL#Details_

         const finalHealthArray = [], finalManaArray = [], finalAttackDamageArray = [], finalAbilityPowerArray = [], finalArmorArray = [], finalMagicResistsArray = []
         for(let level = 1; level <= 18; level++){
            const levelAttackDamage = this.calculateStat(this.champion.stats.attackdamage, level, this.champion.stats.attackdamageperlevel)
            const levelHealth = this.calculateStat(this.champion.stats.hp, level, this.champion.stats.hpperlevel)
            const levelMana = this.champion.partype === "Mana" ? this.calculateStat(this.champion.stats.mp, level, this.champion.stats.mpperlevel) : 0
            const levelArmor = this.calculateStat(this.champion.stats.armor, level, this.champion.stats.armorperlevel)
            const levelMagicResists = this.calculateStat(this.champion.stats.spellblock, level, this.champion.stats.spellblockperlevel)

            const championPassiveJhin = this.champion.id === "Jhin" ? 1 + (this.jhinPassiveValues[level - 1] + (0.25 * (itemsAttackSpeed + miniRuneAttackSpeed)) + (finalCritChance * (items.includes("3124") ? 0 : 0.003))) : 1   // jhin passive attack damage modifier
            const championPassiveOrnnModifier = this.champion.id === "Ornn" ? (items.find(item => this.mythics.includes(item)) && level >= 13) ? 1.14 : 1.1 : 1  // ornn passive health, armor, magic resists modifier
            const championPassivePyke = this.champion.id === "Pyke" ? 1 / 14 : 0   // pyke passive health to ad ratio
            const championPassiveRyze = this.champion.id === "Ryze" ? 0.001 : 0   // ryze passive bonus mana %
            const itemPassiveDemonic = items.includes("4637") ? 0.02 : 0   // demonic embrace % bonus health converted to ability power
            const itemPassiveSterak = items.includes("3053") ? levelAttackDamage *  0.45 : 0 // sterak's gage bonus attack damage
            const itemPassiveTitanic = items.includes("3748") ? 0.02 : 0   // titanic hydra's health % converted to attack damage
            const itemPassiveFimbulwinter = (items.includes("3119") || items.includes("3121")) ? 0.08 : 0   // winter's approach/fimbulwinter passive max mana % converted to health
            const itemPassiveMuramana = (items.includes("3004") || items.includes("3042")) ? 0.025 : 0 // manamune/muramana passive max mana % converted to attack damage

            const finalArmor = levelArmor + ((itemsArmor + miniRuneArmor) * championPassiveOrnnModifier)
            const finalMagicResists = levelMagicResists + (itemsMagicResists * championPassiveOrnnModifier)

            let bonusAttackDamage = itemsAttackDamage + itemPassiveSterak
            let abilityPower = itemsAbilityPower * itemPassiveRabadon
            let bonusHealth = itemsHealth * championPassiveOrnnModifier
            let totalMana = levelMana + itemsMana

            const {attackDamage: runeAttackDamage, abilityPower: runeAbilityPower} = this.miniRuneAdaptiveForce(this.champion.id, bonusAttackDamage, abilityPower)

            bonusAttackDamage += runeAttackDamage
            bonusAttackDamage *= championPassiveJhin
            abilityPower += (runeAbilityPower * itemPassiveRabadon)

            totalMana *= (1 + (abilityPower * championPassiveRyze))

            const itemPassiveAweBonusHealth = (totalMana * itemPassiveFimbulwinter) * championPassiveOrnnModifier
            bonusHealth += itemPassiveAweBonusHealth

            bonusAttackDamage += championPassiveWindBrothers

            const championPassivePykeBonusAttackDamage = bonusHealth * championPassivePyke
            bonusAttackDamage += championPassivePykeBonusAttackDamage

            bonusHealth = this.champion.id === "Pyke" ? 0 : bonusHealth

            const championPassiveVladimirBonusAbilityPower = bonusHealth * championPassiveVladimirHealthToAPRatio * itemPassiveRabadon
            const championPassiveVladimirBonusHealth = (abilityPower * championPassiveVladimirAPToHealthRatio) + (bonusHealth * championPassiveVladimirBonusHealthToApRatio)
            abilityPower += championPassiveVladimirBonusAbilityPower
            bonusHealth += championPassiveVladimirBonusHealth

            const itemPassiveAweBonusAttackDamage = (totalMana * itemPassiveMuramana)
            bonusAttackDamage += itemPassiveAweBonusAttackDamage * championPassiveJhin
            const itemPassiveTitanicBonusAttackDamage = (bonusHealth * itemPassiveTitanic)
            bonusAttackDamage += itemPassiveTitanicBonusAttackDamage * championPassiveJhin

            const itemPassiveDemonicBonusAbilityPower = bonusHealth * itemPassiveDemonic
            abilityPower += itemPassiveDemonicBonusAbilityPower * itemPassiveRabadon

            if(this.champion.id === "Ryze"){
               const itemPassiveDemonicChampionPassiveRyzeBonusMana = (levelMana + itemsMana) * (itemPassiveDemonicBonusAbilityPower * itemPassiveRabadon * championPassiveRyze)
               bonusAttackDamage += itemPassiveDemonicChampionPassiveRyzeBonusMana * itemPassiveMuramana

               const championPassiveRyzeItemFimbulwinterPassiveBonusHealth = itemPassiveDemonicChampionPassiveRyzeBonusMana * itemPassiveFimbulwinter
               bonusHealth += championPassiveRyzeItemFimbulwinterPassiveBonusHealth

               totalMana += itemPassiveDemonicChampionPassiveRyzeBonusMana
            }
            if(this.champion.id === "Vladimir"){
               const itemPassiveDemonicChampionPassiveVladimirBonusHealth = itemPassiveDemonicBonusAbilityPower * itemPassiveRabadon * championPassiveVladimirAPToHealthRatio
               bonusHealth += itemPassiveDemonicChampionPassiveVladimirBonusHealth

               const championPassiveVladimirItemPassiveDemonicAbilityPower = itemPassiveDemonicChampionPassiveVladimirBonusHealth * championPassiveVladimirHealthToAPRatio
               abilityPower += championPassiveVladimirItemPassiveDemonicAbilityPower

               const lastPass = championPassiveVladimirItemPassiveDemonicAbilityPower * championPassiveVladimirAPToHealthRatio
               bonusHealth += lastPass

               bonusAttackDamage += (itemPassiveDemonicChampionPassiveVladimirBonusHealth + championPassiveVladimirItemPassiveDemonicAbilityPower) * itemPassiveTitanic
            }

            const finalHealth = levelHealth + bonusHealth
            const finalMana = totalMana
            const finalAttackDamage = (levelAttackDamage * championPassiveJhin) + bonusAttackDamage
            const finalAbilityPower = abilityPower

            finalHealthArray.push(finalHealth)
            finalManaArray.push(finalMana)
            finalAttackDamageArray.push(finalAttackDamage)
            finalAbilityPowerArray.push(finalAbilityPower)
            finalArmorArray.push(finalArmor)
            finalMagicResistsArray.push(finalMagicResists)
         }

         calculated.attackDamage = finalAttackDamageArray
         calculated.abilityPower = finalAbilityPowerArray
         calculated.health = finalHealthArray
         calculated.mana = finalManaArray
         calculated.armor = finalArmorArray
         calculated.magicResists = finalMagicResistsArray
         calculated.attackSpeed = finalAttackSpeedArray
         calculated.criticalStrike = [finalCritChance, finalCritDamage]
         calculated.armorPenetration = [finalLethality, finalPercentPhysicalPenetration]
         calculated.magicPenetration = [finalFlatMagicPenetration, finalPercentMagicPenetration]

         return calculated
      },
      iconURL(icon){
         return new URL(`../assets/statIcons/${icon}.webp`, import.meta.url).href
      }
   },
   computed:{
      ...mapState(useMainStore, ["getSelectedItems", "allItems", "mythics", "adaptiveForceBias", "getLevel", "getMainChampion", "getTargetChampion", "apVisibility", "getItem", "getSelectedItems", "filterArmorPenItems", "filterMagicPenItems", "asRatioChampions"]),
      selectedItems(){
         return this.getSelectedItems(this.isMain)
      },
      level(){
         return this.getLevel(this.isMain)
      },
      champion(){
         return this.isMain ? this.getMainChampion : this.getTargetChampion
      },
      baseStats(){
         let calculated = {...this.calculateStats(this.selectedItems)}

         if(this.isMain){  // multiple item sets to compare
            var secondItemset = ((this.selectedItems.includes("3036") || this.selectedItems.includes("6676")) && !(this.selectedItems.includes("3036") && this.selectedItems.includes("6676"))) ?
               this.selectedItems.filter(item => item != "3036" && item != "6676")
               : undefined
            if(secondItemset != undefined){
               secondItemset.push(this.selectedItems.includes("3036") ? "6676" : "3036")
               this.setCalculatedStats({stats: [{stats: {...calculated}, items: this.selectedItems, title: this.selectedItems.includes("3036") ? "ldr" : "collector"}, {stats: {...this.calculateStats(secondItemset)}, items: secondItemset, title: this.selectedItems.includes("3036") ? "collector" : "ldr"}], isMain: this.isMain})
            } else{
               this.setCalculatedStats({stats: [{stats: {...calculated}, items: this.selectedItems, title: "damage"}], isMain: this.isMain})
            }
         } else{
            this.setCalculatedStats({stats: {...calculated}, isMain: this.isMain})
         }
         
         if(this.isMain){
            calculated.attackDamage = Math.round(calculated.attackDamage[this.level - 1])
            calculated.armorPenetration = `${calculated.armorPenetration[0]} | ${calculated.armorPenetration[1]}%`
            if(this.apVisibility){
               calculated.abilityPower = Math.round(calculated.abilityPower[this.level - 1])
               calculated.magicPenetration = `${calculated.magicPenetration[0]} | ${calculated.magicPenetration[1]}%`
            } else{
               delete calculated.abilityPower
               delete calculated.magicPenetration
            }
            delete calculated.health
            delete calculated.mana
            delete calculated.armor
            delete calculated.magicResists
            calculated.criticalStrike = `${calculated.criticalStrike[0]}% | ${calculated.criticalStrike[1]}%`
            calculated.attackSpeed = calculated.attackSpeed[this.level - 1]
         } else{
            if(this.apVisibility && this.champion.partype === "Mana"){
               calculated.mana = Math.round(calculated.mana[this.level - 1])
            } else{
               delete calculated.mana
            }
            delete calculated.attackDamage
            delete calculated.abilityPower
            delete calculated.attackSpeed
            delete calculated.armorPenetration
            delete calculated.magicPenetration
            delete calculated.criticalStrike
            calculated.health = ~~calculated.health[this.level - 1]
            calculated.armor = Math.round(calculated.armor[this.level - 1])
            calculated.magicResists = Math.round(calculated.magicResists[this.level - 1])
         }

         return calculated
      },
      tooltipTitles(){
         return {
            armorPenetration: "lethality | armor penetration",
            magicPenetration: "flat penetration | percentage penetration",
            criticalStrike: "critical strike chance | critical strike damage"
         }
      },
      filteredStats(){
         return Object.keys(this.baseStats).filter(key => {
               return this.baseStats[key] != undefined
         }).reduce((obj, key) => {return {...obj, [key]: this.baseStats[key]}}, {})
      }
   }
})
</script>

<style scoped>
main h3{
   text-align: center;
   padding-bottom: 0.25em;
}
.baseStats{
   display: flex;
   flex-direction: column;
   flex-wrap: wrap;
}
.baseStatContainer{
   flex-direction: column;
   padding-bottom: 0.5em;
}
.baseStatContainer label{
   display: flex;
   align-items: center;
   justify-content: center;
   font-weight: 700;
   color: var(--accent1);
   padding-bottom: 0.2em;
}
.baseStatContainer label.tooltipAvailable{
   cursor: help;
}
@media (min-width: 768px) {
   .baseStats{
      flex-direction: row;
   }
}
</style>