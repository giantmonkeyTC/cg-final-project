const webpack = require("webpack");

plugins: [
    new webpack.ProvidePlugin({'THREE':'three/build/three'})
]