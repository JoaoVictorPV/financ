import type * as echarts from "echarts";

export type EChartsOption = echarts.EChartsOption;
// Mantemos um tipo estrutural mínimo para callbacks (evita depender de exports internos do echarts)
export type EChartsCallbackParams = {
  name?: string;
  value?: unknown;
  axisValue?: string;
  data?: unknown;
};
