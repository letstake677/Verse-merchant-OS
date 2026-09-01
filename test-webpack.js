const externals = function() {};
console.log([...(externals || [])]);
