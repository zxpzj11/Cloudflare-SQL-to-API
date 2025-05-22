<template>
  <div class="field-row">
    <el-row :gutter="10">
      <!-- 字段名 -->
      <el-col :span="4">
        <el-form-item :prop="`fields.${index}.name`" :rules="nameRules">
          <el-input
            v-model="field.name"
            placeholder="字段名"
            size="small"
            @input="updateField"
          />
        </el-form-item>
      </el-col>

      <!-- 字段类型 -->
      <el-col :span="3">
        <el-form-item :prop="`fields.${index}.type`">
          <el-select
            v-model="field.type"
            placeholder="类型"
            size="small"
            @change="updateField"
          >
            <el-option label="文本" value="string" />
            <el-option label="整数" value="integer" />
            <el-option label="小数" value="decimal" />
            <el-option label="浮点数" value="float" />
            <el-option label="布尔值" value="boolean" />
            <el-option label="日期时间" value="datetime" />
            <el-option label="日期" value="date" />
            <el-option label="时间" value="time" />
            <el-option label="二进制" value="blob" />
          </el-select>
        </el-form-item>
      </el-col>

      <!-- 长度 -->
      <el-col :span="2">
        <el-form-item>
          <el-input
            v-model.number="field.length"
            placeholder="长度"
            size="small"
            type="number"
            :disabled="!showLengthField"
            @input="updateField"
          />
        </el-form-item>
      </el-col>

      <!-- 可选项 -->
      <el-col :span="8">
        <div class="options-row">
          <el-checkbox v-model="field.nullable" @change="updateField">
            可空
          </el-checkbox>
          <el-checkbox
            v-model="field.primary_key"
            @change="handlePrimaryKeyChange"
          >
            主键
          </el-checkbox>
          <el-checkbox
            v-model="field.unique_field"
            :disabled="field.primary_key"
            @change="updateField"
          >
            唯一
          </el-checkbox>
          <el-checkbox
            v-model="field.auto_increment"
            :disabled="!canBeAutoIncrement"
            @change="updateField"
          >
            自增
          </el-checkbox>
        </div>
      </el-col>

      <!-- 默认值 -->
      <el-col :span="4">
        <el-form-item>
          <el-input
            v-model="field.default_value"
            placeholder="默认值"
            size="small"
            :disabled="field.auto_increment || field.primary_key"
            @input="updateField"
          />
        </el-form-item>
      </el-col>

      <!-- 操作按钮 -->
      <el-col :span="3">
        <div class="action-buttons">
          <el-tooltip content="上移" placement="top" :disabled="index === 0">
            <el-button
              type="primary"
              icon="el-icon-arrow-up"
              size="small"
              circle
              :disabled="index === 0"
              @click="moveField('up')"
            />
          </el-tooltip>
          <el-tooltip
            content="下移"
            placement="top"
            :disabled="index === fieldsCount - 1"
          >
            <el-button
              type="primary"
              icon="el-icon-arrow-down"
              size="small"
              circle
              :disabled="index === fieldsCount - 1"
              @click="moveField('down')"
            />
          </el-tooltip>
          <el-tooltip content="删除" placement="top">
            <el-button
              type="danger"
              icon="Delete"
              size="small"
              circle
              @click="removeField"
            />
          </el-tooltip>
        </div>
      </el-col>
    </el-row>

    <!-- 第二行: 描述 -->
    <el-row>
      <el-col :span="22">
        <el-form-item>
          <el-input
            v-model="field.description"
            placeholder="字段描述（可选）"
            size="small"
            @input="updateField"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { Delete } from "@element-plus/icons-vue";
import type { TableField } from "~/server/utils/crud-generator";

interface Props {
  field: TableField;
  index: number;
  fieldsCount: number;
}

const props = defineProps<Props>();

const emit = defineEmits([
  "update:field",
  "remove-field",
  "move-field",
  "primary-key-change",
]);

// 字段名规则
const nameRules = [
  {
    required: true,
    message: "字段名不能为空",
    trigger: "blur",
  },
  {
    pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
    message: "字段名必须以字母开头，且只能包含字母、数字和下划线",
    trigger: "blur",
  },
];

// 是否显示长度字段
const showLengthField = computed(() => {
  const stringTypes = ["string", "varchar", "char"];
  return stringTypes.includes(props.field.type);
});

// 是否可以为自增
const canBeAutoIncrement = computed(() => {
  const numericTypes = ["integer", "int", "smallint", "bigint"];
  return props.field.primary_key && numericTypes.includes(props.field.type);
});

// 防止组件为副本的方式绑定
const updateField = () => {
  emit("update:field", props.field);
};

// 处理主键变更
const handlePrimaryKeyChange = () => {
  if (props.field.primary_key) {
    // 如果设为主键，则不可为空
    props.field.nullable = false;
    // 如果是数字类型，自动设为自增
    if (["integer", "int", "smallint", "bigint"].includes(props.field.type)) {
      props.field.auto_increment = true;
    }
    // 当设为主键时，取消唯一约束（因为主键已经唯一）
    props.field.unique_field = false;
  } else {
    // 如果取消主键，则取消自增
    props.field.auto_increment = false;
  }

  updateField();
  // 同时通知父组件主键状态变更
  emit("primary-key-change", props.index, props.field.primary_key);
};

// 移动字段
const moveField = (direction: "up" | "down") => {
  emit("move-field", props.index, direction);
};

// 删除字段
const removeField = () => {
  emit("remove-field", props.index);
};

// 监听类型变化
watch(
  () => props.field.type,
  (newType) => {
    // 如果类型变更为非数字类型，取消自增
    if (
      props.field.auto_increment &&
      !["integer", "int", "smallint", "bigint"].includes(newType)
    ) {
      props.field.auto_increment = false;
      updateField();
    }
  }
);
</script>

<style scoped>
.field-row {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #f8f9fa;
}

.options-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  gap: 8px;
}
</style>
