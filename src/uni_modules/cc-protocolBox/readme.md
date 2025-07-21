# cc-protocolBox 
 
### 我的技术微信公众号

![图片](https://i.postimg.cc/RZ0sjnYP/front-End-Component.jpg)


#### 使用方法 
```使用方法
<!-- agree：是否同意勾选  protocolArr：协议数组 @click：勾选同意点击 @protocolClick：协议点击 -->
<cc-protocolBox :agree="agree" :protocolArr="protocolArr" @click="agree = !agree"
			@protocolClick="protocolClick"></cc-protocolBox>	

```

#### HTML代码实现部分
```html
<template>
	<view>

		<view class="header">单个协议条款</view>

		<!-- agree：是否同意勾选  protocolArr：协议数组 @click：勾选同意点击 @protocolClick：协议点击 -->
		<cc-protocolBox :agree="agree" :protocolArr="protocolArr" @click="agree = !agree"
			@protocolClick="protocolClick"></cc-protocolBox>


		<view class="header">多个协议条款</view>

		<!-- agree：是否同意勾选  protocolArr：协议数组 @click：勾选同意点击 @protocolClick：协议点击 -->
		<cc-protocolBox :agree="agreeTwo" :protocolArr="protocolArrTwo" @click="agreeTwo = !agreeTwo"
			@protocolClick="protocolClickTwo"></cc-protocolBox>


	</view>
</template>

<script>
	export default {
		data() {
			return {
				agree: false,
				agreeTwo: false,
				protocolArr: ["<App隐私协议>"],
				protocolArrTwo: ["风险提示函", "基金合同", "招募说明书", "基金产品概要"],

			}
		},
		methods: {

			protocolClick(tag) {

				console.log('点击协议序列 = ' + tag);
				uni.showModal({
					title: '点击协议',
					content: '点击协议序列 = ' + tag
				})
			},

			protocolClickTwo(tag) {

				console.log('点击协议序列 = ' + tag);
				uni.showModal({
					title: '点击协议',
					content: '点击协议序列 = ' + tag
				})
			},
		}
	}
</script>

<style scoped>
	.header {
		margin-top: 20px;
		padding: 10px 20px;
		font-size: 16px;
		background-color: antiquewhite;

	}
</style>



```

#### 组件实现代码 
```组件实现代码
<template>
	<view class="protocol_box">
		<view class="select" :class="{active: agree}" @click="agreeClick"></view>
		我已仔细阅读

		<view v-for="(item, index) in protocolArr" :key="index">

			<text @click="protocolClick(index)">{{protocolArr[index]}}</text>

			<span v-if="index < (protocolArr.length - 1)">{{" 、"}}</span>

		</view>

	</view>
</template>

<script>
	export default {
		props: {
			// 是否同意
			agree: {
				type: Boolean,
				default: false
			},
			// 协议数组
			protocolArr: {
				type: Array,
				default: function() {
					return [];
				}
			},

		},

		methods: {
			// 是否同意勾选
			agreeClick() {

				this.$emit('click')

			},
			protocolClick(tag) {

				this.$emit('protocolClick', tag)

			}

		}


	}
</script>




<style lang="scss" scoped>
	//主题色 #ea552d
	$themeColor: #ea552d;



	.protocol_box {

		display: flex;
		flex-wrap: wrap;


		justify-content: center;
		align-items: center;

		margin-top: 40rpx;
		margin-left: 2%;
		width: 96%;
		font-size: 28rpx;
		color: #333333;
		font-size: 13px;




		.select {
			width: 36rpx;
			height: 36rpx;
			background-image: url("./ic_nor.png");
			background-position: center center;
			background-repeat: no-repeat;
			background-size: 100% auto;
			margin-right: 15rpx;
			margin-top: 2px;


			&.active {
				background-image: url("./ic_sel.png");
			}
		}

		text {


			color: $themeColor;
			font-size: 13px;

			white-space: pre-wrap;



		}


	}
</style>
					


```