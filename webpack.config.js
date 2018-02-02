var webpack = require('webpack');
var path = require('path');
const rxPaths = require('rxjs/_esm5/path-mapping');
var LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
    .BundleAnalyzerPlugin;

module.exports = {
    entry: {
        main: path.join(__dirname, 'src/index.js')
    },
    output: {
        path: path.join(__dirname, 'public'),
        filename: '[name].js'
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['env', { targets: { ie: 11 }, modules: false }]
                        ],
                        plugins: [
                            'lodash',
                            require('babel-plugin-transform-object-rest-spread'),
                            [
                                require('babel-plugin-transform-imports'),
                                {
                                    'rxjs/operators': {
                                        transform:
                                            'rxjs/_esm5/operators/${member}',
                                        preventFullImport: true,
                                        skipDefaultConversion: true
                                    }
                                }
                            ]
                        ]
                    }
                }
            },
            {
                test: /\.twig$/,
                use: [
                    'babel-loader',
                    {
                        loader: 'melody-loader',
                        options: {
                            plugins: ['idom']
                        }
                    }
                ]
            }
        ]
    },
    resolve: {
        alias: Object.assign(
            {
                lodash: 'lodash-es'
            },
            rxPaths()
        )
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
        }),
        new LodashModuleReplacementPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true
        }),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new BundleAnalyzerPlugin()
    ],
    node: {
        // Polyfills and mocks to run Node.js-
        // environment code in non-Node environments.
        console: false, // boolean | "mock"
        global: false, // boolean | "mock"
        process: false, // boolean
        __filename: false, // boolean | "mock"
        __dirname: false, // boolean | "mock"
        Buffer: false, // boolean | "mock"
        setImmediate: false // boolean | "mock" | "empty"
    },
    devServer: {
        contentBase: path.join(__dirname, 'public'),
        watchOptions: {
            ignored: /node_modules/
        },
        overlay: false
    }
};
