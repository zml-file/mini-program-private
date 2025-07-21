<template>
  <block v-for="(item, index) in data" :key="item.id">
    <block v-if="item.type == 1">
      <bc-qa-item
        :bgType="bgType"
        @checked="(val: string | number) => (submitList[index].optionId = +val)"
        :item="item"
        :checkboxList="item.checkboxList"></bc-qa-item>
    </block>
    <block v-else-if="item.type == 2">
      <bc-qa-item :bgType="bgType" v-model="submitList[index].userSubmitContent" :item="item" type="text"></bc-qa-item>
    </block>
    <block v-else-if="item.type == 3">
      <bc-qa-item
        :bgType="bgType"
        v-model="submitList[index].userSubmitContent"
        :item="item"
        type="text"
        :maxLength="2000"></bc-qa-item>
    </block>
  </block>
</template>

<script setup lang="ts">
defineProps({
  data: {
    type: Array<{ id: number; type: number; checkboxList: { id: number; optionContent: string }[] }>,
    default: () => [],
  },
  submitList: {
    type: Array<{ optionId: number; userSubmitContent: string }>,
    default: () => [],
  },
  bgType: {
    type: String,
    default: 'white',
  },
});
</script>
