import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
    entry: "./src/index.js",
    output: {
        filename: "[name].js",
        path: resolve(__dirname, "../backend/src/dist"),
        clean: true,
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/template.html",
        }),
        new MiniCssExtractPlugin({
            filename: "css/[name].css"
        }),
    ],
    optimization: {
        minimizer: [
            // For webpack v5, you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line // `...`,
            new CssMinimizerPlugin(),
        ],
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"]
            },
            {
                test: /\.html$/i,
                use: ["html-loader"]
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: "asset/resource",
            },
            {
                test: /\.(woff|woff2)$/i,
                type: 'asset/resource',
            },

        ]
    }
}