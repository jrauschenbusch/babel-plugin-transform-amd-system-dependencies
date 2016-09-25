export default function ({
  types: t
}) {
  return {
    pre() {
      this.amdDeps = [];
      this.anonDefine = false;
      this.anonDefineIndex = -1;
      this.anonNamed = false;
      this.bundleDefines = [];
      // Save filtered amd dependencies in the file metadata
      this.file.metadata.amdDeps = this.amdDeps;
    },
    visitor: {
      CallExpression: {
        enter(path, state) {

          var that = this;

          // don't perform nested transformations
          if (this.outerModuleDefinition) {
            return;
          }

          const callee = path.node.callee;
          const args = path.node.arguments;

          if (t.isIdentifier(callee, {
            name: 'define'
          }) &&
            args.length >= 1 &&
            args.length <= 3) {

            // remember the outer `define()` to avoid transforming the inner ones
            this.outerModuleDefinition = path;

            let name,
              depArg = -1;

            if (t.isStringLiteral(args[0]) || args[1] && t.isArrayExpression(args[1])) {
              name = args[0].value || true;
              if (args[1] && t.isArrayExpression(args[1])) {
                depArg = 1;
              }
            }
            else if (t.isArrayExpression(args[0])) {
              depArg = 0;
            }

            var factoryArg = name && depArg == -1 ? 1 : depArg + 1;

            if (!args[factoryArg]) {
              return;
            }

            // note the define index
            // so we know which one to name for the second pass
            if (!this.anonDefine || this.anonNamed)
              this.anonDefineIndex++;

            let parseamdDeps = false;

            // anonymous define
            if (!name) {
              if (this.anonDefine && !this.anonNamed)
                throw new Error('Multiple anonymous defines.');

              this.anonDefine = true;
              this.anonNamed = false;
              parseamdDeps = true;
            }
            // named define
            else {
              if (typeof name != 'boolean') {
                this.bundleDefines.push(name);
                this.amdDeps.splice(this.amdDeps.indexOf(name), 1);
              }
              if (!this.anonDefine && this.anonDefineIndex == 0 && typeof name != 'boolean') {
                this.anonDefine = true;
                this.anonNamed = true;
                parseamdDeps = true;
              }
              else if (this.anonDefine && this.anonNamed) {
                this.anonDefine = false;
                this.anonNamed = false;
                this.amdDeps = [];
              }
            }

            if (!parseamdDeps) {
              return;
            }

            if (depArg !== -1 && args[depArg].elements) {
              args[depArg].elements.forEach(function (dep) {
                if (['require', 'exports', 'module'].indexOf(dep.value) != -1)
                  return;
                if (that.bundleDefines.indexOf(dep.value) != -1)
                  return;
                that.amdDeps.push(dep.value);
              });
            } else if (depArg === -1 && t.isFunctionExpression(args[factoryArg])) {
              let cjsFactory = args[factoryArg],
                fnParameters = args[factoryArg].params,
                requireParam = fnParameters[0];

              if (requireParam) {
                const filterAMDamdDeps = {
                  // Visitor to determine all required dependencies if no this.amdDeps array is provided but a factory function with present `require` param.
                  CallExpression(path) {
                    const callee = path.node.callee;
                    const args = path.node.arguments;

                    // Get function scope of defineFactory where param is used
                    if (path.scope.bindings[requireParam.name] &&
                      path.scope.bindings[requireParam.name].identifier === requireParam &&
                      t.isIdentifier(callee, {
                        name: requireParam.name
                      })) {
                      that.amdDeps.push(args[0].value);
                    }
                  }
                };
                path.traverse(filterAMDamdDeps);
              }
            }
          }
        },
        exit(path) {
          // are we inside a `define()`?
          if (this.outerModuleDefinition === path) {
            this.outerModuleDefinition = null;
          }
        }
      }
    }
  };
}
