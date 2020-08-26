import '../style/visual.less';
import _ = require('lodash');
import * as echarts from 'echarts';


let isTooltipModelShown = false;

export default class Visual extends WynVisual {
    private container: HTMLDivElement;
    private host: any;
    private chart: any;
    private properties: any;
    private items: any;
    private selectionManager: any;
    private selection: any[] = [];
    private valueField: string;
    private categoryField: string;

    static mockItems = [
        ["January", "February", "March", "April", "May", "Grand Total"], [12, 20, 6, -7, 59]
    ];

    constructor(dom: HTMLDivElement, host: VisualNS.VisualHost, options: VisualNS.IVisualUpdateOptions) {
        super(dom, host, options)
        this.container = dom;
        this.chart = echarts.init(dom)
        this.items = [];
        this.properties = {
            fontSize: 14,
            textColor: '#000000',
            customPaletteColor: ['#32b31f', '#bf2020', 'eb4b5c', 'eb4b5c'],
            customShowMark: 'false'
        };

        this.host = host;
        this.bindEvents();
        this.selectionManager = host.selectionService.createSelectionManager();
    }

    // toolTip
    private showTooltip = _.debounce((params, asModel = false) => {

        if (asModel) isTooltipModelShown = true;
        this.host.toolTipService.show({
            position: {
                x: params.event.event.x,
                y: params.event.event.y,
            },

            fields: [{
                label: params.name,
                value: params.data[params.data.length - 1],
            }],
            selected: this.selectionManager.getSelectionIds(),
            menu: true,
        }, 10);
    });

    private hideTooltip = () => {
        this.host.toolTipService.hide();
        isTooltipModelShown = false;
    }

    createSelectionId = (sid?) => this.host.selectionService.createSelectionId(sid);

    private dispatch = (type, payload) => this.chart.dispatchAction({ ...payload, type });

    public bindEvents = () => {
        // listner click 
        this.container.addEventListener('click', (e: any) => {
            if (!e.seriesClick) {
                // clear tooltip
                this.hideTooltip();
                // clear selection
                this.selection.forEach(i => this.dispatch('downplay', i));
                this.selection = [];
                this.selectionManager.clear();
                return;
            }
        })

        this.container.addEventListener('mouseleave', (e: any) => {
            if (isTooltipModelShown) return;
            this.hideTooltip();
        })

        this.chart.on('mousemove', (params) => {
            if (params.componentType !== 'series') return;

            if (!isTooltipModelShown) this.showTooltip(params);
        })

        this.chart.on('click', (params) => {

            if (params.componentType !== 'series') return;

            this.showTooltip(params, true);

            params.event.event.seriesClick = true;

            const selectInfo = {
                seriesIndex: params.seriesIndex,
                dataIndex: params.dataIndex,
            };
            // linkage logic,get series index
            if (this.items[2][params.dataIndex]) {
                const sid = this.items[2][params.dataIndex];
                this.selectionManager.select(sid, true);
            }

            this.dispatch('highlight', selectInfo);
            this.selection.push(selectInfo)
        })
    }

    public update(options: VisualNS.IVisualUpdateOptions) {
        const dataView = options.dataViews[0];
        this.items = [];
        if (dataView &&
            dataView.plain.profile.ActualValue.values.length && dataView.plain.profile.dimension.values.length) {
            const plainData = dataView.plain;
            const dimension = plainData.profile.dimension.values[0].display;
            const ActualValue = plainData.profile.ActualValue.values[0].display;

            this.categoryField = dimension;
            this.valueField = ActualValue;

            const getSelectionId = (item) => {
                const selectionId = this.createSelectionId();
                dimension && selectionId.withDimension(plainData.profile.dimension.values[0], item)
                // ActualValue && selectionId.withDimension(plainData.profile.ActualValue.values[0], item)
                return selectionId
            }

            this.items[0] = plainData.data.map((item) => item[dimension]);
            this.items[0].push('Grand Total');
            this.items[1] = plainData.data.map((item) => item[ActualValue]);
            this.items[2] = plainData.data.map((item) => getSelectionId(item));

            if (plainData.profile.dimension.values.length > 1) {
                const dimension2 = plainData.profile.dimension.values[1].display;
                this.items[3] = plainData.data.map((item) => item[dimension2]);
            }
        }

        this.properties = options.properties;
        this.chart.resize();
        this.render();
    }

    public getBasicData = (dy, zt = [], label = [], options: any) => {
        for (let i = 0; i < dy.length; i++) {
            let obj = [];
            let getBarColor = (index) => {
                let barColor = ''
                if (index === 0) {
                    barColor = options.customPaletteColor[2].colorStops ? options.customPaletteColor[2].colorStops[0] : options.customPaletteColor[2]
                } else {
                    barColor = options.customPaletteColor[3].colorStops ? options.customPaletteColor[3].colorStops[0] : options.customPaletteColor[3]
                }
                return barColor
            }
            if (i === 0 || i === dy.length - 1) {
                let x = parseFloat(dy[i]);
                if (x < 0) {
                    label.push({
                        value: dy[i],
                        coord: [i, x],
                        label: {
                            position: 'bottom',
                            show: true,
                            fontSize: options.fontSize,
                            color: getBarColor(i)
                        }
                    });
                } else {
                    label.push({ value: dy[i], coord: [i, x] });
                }
                obj.push(0);
                obj.push(dy[i]);
                obj.push(dy[i]);
                obj.push(dy[i]);
                zt.push(obj);
            } else {
                var start = zt[i - 1][1];
                var val = parseFloat(dy[i]);
                var end = start + val;
                if (dy[i] < 0) {
                    label.push({
                        value: dy[i],
                        coord: [i, end],
                        label: {
                            position: 'bottom',
                            show: options.customShowMark,
                            fontSize: options.fontSize,
                            color: options.customPaletteColor[1].colorStops ? options.customPaletteColor[1].colorStops[0] : options.customPaletteColor[1]
                        }
                    });
                } else {
                    label.push({
                        value: dy[i],
                        coord: [i, end]
                    });
                }
                obj.push(start);
                obj.push(end);
                obj.push(end);
                obj.push(end);
                zt.push(obj);
            }
        }
        return {
            dy,
            zt,
            label
        }
    }

    public getLineData = (data: Array<number>) => {
        let line = []
        for (let i = 0; i < data.length; i++) {
            if (i === 0) {
                line[0] = data[0]
            } else {
                let sumData = data.slice(0, i + 1)
                line[i] = _.sum(sumData)
            }
        }
        line[data.length - 1] = 0
        return line
    }

    public render() {
        this.chart.clear();
        // get data
        const isMock = !this.items.length;
        const options = this.properties;
        const initData = isMock ? Visual.mockItems[1] : this.items[1];
        const dx: Array<any> = isMock ? Visual.mockItems[0] : this.items[0];
        const dxSecondary: Array<any> = isMock ? Visual.mockItems[0] : this.items[3] !== undefined ? this.items[3] : [];
        const dyData: Array<any> = initData.concat([_.sum(initData)]);
        let { dy, zt, label } = this.getBasicData(dyData, [], [], options);
        const lineData = this.getLineData(dyData);
        let axisOffset = 0, showSecondaryAxis = false;
        if (!isMock && dxSecondary.length > 0) {
            axisOffset = 20;
            showSecondaryAxis = true;
        }
        // get properties

        const option = {
            xAxis: [{
                type: 'category',
                data: dx,
                offset: axisOffset,
                show: options.showCategoryAxis,
                name: options.categoryAxisTitle ? this.categoryField : "",
                nameLocation: "center",
                nameGap: 25,
                nameTextStyle: {
                    fontFamily: options.categoryAxisTextStyle.fontFamily,
                    fontSize: 16
                },
                axisLine: {
                    show: options.categoryAxisLine
                },
                axisTick: {
                    show: options.categoryAxisTickMark
                },
                axisLabel: {
                    show: options.categoryAxisTickLabel,
                    //margin: 10,
                    //align: 'center',                   
                    textStyle: {
                        fontSize: options.categoryAxisTextStyle.fontSize.substring(0, 2),
                        fontFamily: options.categoryAxisTextStyle.fontFamily,
                        fontWeight: options.categoryAxisTextStyle.fontWeight,
                        fontStyle: options.categoryAxisTextStyle.fontStyle,
                        color: options.categoryAxisTextStyle.color,

                    }
                },
            },
            {
                type: 'category',
                position: 'bottom',
                data: dxSecondary,
                show: showSecondaryAxis,
                axisLine: {
                    onZero: false,
                    show: false
                },
                axisTick: {
                    show: false
                },
                axisLabel: {
                    margin: 10,
                    textStyle: {
                        fontSize: options.fontSize,
                        color: "#000000"
                    }
                },
            }],
            yAxis: {
                type: 'value',
                scale: true,
                show: options.showValueAxis,
                name: options.valueAxisTitle ? this.valueField : "",
                nameLocation: "middle",
                nameGap: 40,
                nameTextStyle: {
                    fontFamily: options.valueAxisTextStyle.fontFamily,
                    fontSize: 16
                },
                min: options.valueAxisMinValue,
                max: options.valueAxisMaxValue,
                interval: options.valueAxisInterval,
                axisLine: {
                    show: options.valueAxisLine
                },
                axisTick: {
                    show: options.valueAxisTickMark
                },
                axisLabel: {
                    show: options.valueAxisTickLabel,
                    //margin: 10,
                    //align: 'center',                    
                    textStyle: {
                        fontSize: options.valueAxisTextStyle.fontSize.substring(0, 2),
                        fontFamily: options.valueAxisTextStyle.fontFamily,
                        fontWeight: options.valueAxisTextStyle.fontWeight,
                        fontStyle: options.valueAxisTextStyle.fontStyle,
                        color: options.valueAxisTextStyle.color,

                    }
                },
                splitLine: {
                    show: options.valueAxisGridline,
                    lineStyle: {
                        color: options.valueAxisGridlineColor
                    }
                }
            },
            legend: {
                data: [{
                    name: 'Increase',
                    fontSize: options.legendFontSize,
                    textStyle: { color: options.customPaletteColor[0].colorStops ? options.customPaletteColor[0].colorStops[0] : options.customPaletteColor[0] }
                }, {
                    name: 'Decrease',
                    fontSize: options.legendFontSize,
                    textStyle: { color: options.customPaletteColor[1].colorStops ? options.customPaletteColor[1].colorStops[0] : options.customPaletteColor[1] }
                }],
                show: options.customShowLegend,
                left: options.legendHorizontalPosition,
                top: options.legendVerticalPosition
            },
            series: [{
                type: 'candlestick',
                name: 'Increase',
                barCategoryGap: '10',
                //Start Value、End Value、Max、Min
                //[[1,2,3,4]
                data: zt,
                itemStyle: {
                    color: options.customPaletteColor[0].colorStops ? options.customPaletteColor[0].colorStops[0] : options.customPaletteColor[0],
                    color0: options.customPaletteColor[1].colorStops ? options.customPaletteColor[1].colorStops[0] : options.customPaletteColor[1],
                    opacity: options.customOpacity / 100,
                    borderWidth: 0,
                },
                markPoint: {
                    symbol: 'rect',
                    symbolSize: 0.000000000000001,
                    label: {
                        show: options.customShowMark,
                        color: options.customPaletteColor[0].colorStops ? options.customPaletteColor[0].colorStops[0] : options.customPaletteColor[0],
                        position: 'top',
                        fontSize: options.fontSize,
                        formatter: function (res) {
                            return res.data.value;
                        }
                    },
                    data: label
                },
                emphasis: {
                    itemStyle: {
                        borderWidth: 0
                    }
                }
            },
            {
                type: 'line',
                step: 'end',
                symbol: 'none',
                data: options.customShowLine ? lineData : [],
                itemStyle: {
                    normal: {
                        lineStyle: {
                            width: 1,
                            color: options.customLineColor,
                            type: 'dotted'
                        }
                    }
                }
            },
            {
                name: 'Decrease',
                type: 'bar',
                data: [],
                itemStyle: {
                    normal: {
                        color: options.customPaletteColor[1].colorStops ? options.customPaletteColor[1].colorStops[0] : options.customPaletteColor[1]
                    }
                }
            }]
        };

        this.chart.setOption(option);
    }

    public onDestroy() {

    }

    public onResize() {

        this.chart.resize();
        this.render();
    }

    public getInspectorHiddenState(options: VisualNS.IVisualUpdateOptions): string[] {

        if (!options.properties.customShowLegend) {
            return ['legendFontSize', 'legendHorizontalPosition', 'legendVerticalPosition']
        }

        if (!options.properties.customShowLine) {
            return ['customLineColor']
        }
        return null;
    }

    public getActionBarHiddenState(options: VisualNS.IVisualUpdateOptions): string[] {
        return null;
    }
}