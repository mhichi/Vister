/* Main Vister file. */

Vister = (function () {

    function cloneElement(element) {
        let clone = new Element(element.parent, element.tagName, element.funcs.dataFunc, element.comparer);

        clone.funcs = cloneFuncs(element.funcs);
        //clone.nodes = element.nodes;
        

        let ilen = element.children.length;

        for (let i = 0; i < ilen; i++) {
            let child = cloneElement(element.children[i]);
            clone.children.push(child);
        } 

        return clone;
    }

    function cloneFuncs(funcs) {
        let holder = new FunctionHolder();

        holder.tag = funcs.tag;

        let ilen = funcs.attributeFuncs.length;

        for (let i = 0; i < ilen; i++) {
            let entry = funcs.attributeFuncs[i];
            let fn = new FunctionEntry(entry.id, entry.func);
            holder.attributeFuncs.push(fn);
        }

        ilen = funcs.styleFuncs.length;
        for (let i = 0; i < ilen; i++) {
            let entry = funcs.styleFuncs[i];
            let fn = new FunctionEntry(entry.id, entry.func);
            holder.styleFuncs.push(fn);
        }

        ilen = funcs.eventFuncs.length;
        for (let i = 0; i < ilen; i++) {
            let entry = funcs.eventFuncs[i];
            let fn = new FunctionEntry(entry.id, entry.func);
            holder.eventFuncs.push(fn);
        }
        /*This is not solved Andreas of the future!*/

        holder.valueFunc = funcs.valueFunc;
        //holder.createFunc = funcs.createFunc;
        holder.dataFunc = funcs.dataFunc;
        holder.textFunc = funcs.textFunc;

        return holder;
    }

    function createNode(parent, element, datum, index) {

        let node = new Node(element, parent, datum, index);
        setValues(node, element.funcs);

        return node;
    }

    function setValues (node, funcs) {
        if (funcs.textFunc !== null) {

            if (typeof funcs.textFunc === 'function') {
                let bf = funcs.textFunc.bind(node.documentObject);
                node.textNode.nodeValue = bf(node);
            }
            else {
                node.textNode.nodeValue = funcs.textFunc;
            }
        }

        if (funcs.valueFunc !== null) {
            if (typeof funcs.valueFunc === 'function') {
                let bf = funcs.valueFunc.bind(node.documentObject);
                node.documentObject.value = bf(node);
            }
            else {
                node.documentObject.value = funcs.valueFunc;
            }
        }

        let ilen = funcs.styleFuncs.length;

        for (let i = 0; i < ilen; i++) {

            let entry = funcs.styleFuncs[i];

            if (typeof entry.func === 'function') {

                let bf = entry.func.bind(node.documentObject);
                node.documentObject.style[entry.id] = bf(node);

            }
            else {
                node.documentObject.style[entry.id] = entry.func;
            }
        }

        ilen = funcs.attributeFuncs.length;

        for (let i = 0; i < ilen; i++) {
            let entry = funcs.attributeFuncs[i];

            let isCheck = false;
            let isDisabled = false;
            if (entry.id.toLowerCase() === "checked") { isCheck = true; }
            else if (entry.id.toLowerCase() === "disabled") { isDisabled = true; }

            if (typeof entry.func === 'function') { 
                let bf = entry.func.bind(node.documentObject);
                
                if (isCheck) {
                    let state = bf(node);

                    if (state.toString().toLowerCase() === "checked" || state === true) {
                        node.documentObject.setAttribute("checked", "checked");
                        node.documentObject.checked = true;
                    }
                    else {
                        node.documentObject.setAttribute("checked", "");    
                        node.documentObject.checked = false;
                    }
                }
                else if (isDisabled) {
                    node.documentObject.disabled = bf(node);
                }
                else {
                    node.documentObject.setAttribute(entry.id, bf(node));
                }

            }
            else {
                if (isCheck) {
                    let state = entry.func;

                    if (state.toString().toLowerCase() === "checked" || state === true) {
                        node.documentObject.setAttribute("checked", "checked");
                        node.documentObject.checked = true;
                    }
                    else {
                        node.documentObject.setAttribute("checked", "");
                        node.documentObject.checked = false;
                    }
                }
                else {
                    node.documentObject.setAttribute(entry.id, entry.func);
                }
            }
        }

        ilen = funcs.eventFuncs.length;

        node.removeHandlers();

        for (let i = 0; i < ilen; i++) {
            let entry = funcs.eventFuncs[i];
            node.addHandler(entry.id, entry.func);
        }

        if (funcs.updateFunc !== null) {
            if (typeof funcs.updateFunc === 'function') {
                let bf = funcs.updateFunc.bind(node.documentObject);
                bf(node);
            }
        }


    }

    function updateNode(node, element) {
        setValues(node, element.funcs);
        return;
    }

    function Element(parent = null, t = "div", d = null, c = null, id = null) {
        this.funcs = new FunctionHolder();
        this.funcs.dataFunc = d;
        this.tagName = t;
        this.children = [];
        this.id = id;
        this.nodes = [];
        this.innerData = [];
        this.parent = parent;
        this.comparer = c;


        this.append = function (t = "div", d = null, c = null, id = null) {

            let element = null;

            if (t instanceof Element) {
                let p = t;

                while (p.parent !== null) {
                    p = p.parent;
                }

                element = p.clone(this);
            }
            else {
                element = new Element(this, t, d, c, id);
            }
            
            let ilen = this.nodes.length;

            for (let i = 0; i < ilen; i++) {
                let pn = this.nodes[i];
                let g = pn.createGroup(element);
                g.generateNodes();
            }

            if (t instanceof Element) {
                //If this is template element, then we need to make sure all data nodes are generated for the clones.
                this.update();
            }

            this.children.push(element);
            return element; 
        };

        this.attribute = function (id = null, f = null) {

            if (id === null) {
                return funcs.attributeFuncs;
            }

            this.funcs.setAttribute(id, f);

            let isCheck = false;
            let isDisabled = false;
            if (id.toLowerCase() === "checked") { isCheck = true; }
            else if (id.toLowerCase() === "disabled") { isDisabled = true; }


            let ilen = this.nodes.length;

            if (typeof f === 'function') {
                for (let i = 0; i < ilen; i++) {
                    let node = this.nodes[i];
                    let bf = f.bind(node.documentObject);

                    if (isCheck) {
                        let state = bf(node);

                        if (state.toString().toLowerCase() === "checked" || state === true) {
                            node.documentObject.setAttribute("checked", "checked");
                            node.documentObject.checked = true;
                        }
                        else {
                            node.documentObject.setAttribute("checked", "");
                            node.documentObject.checked = false;
                        }
                    }
                    if (isDisabled) {
                        node.documentObject.disabled = bf(node);
                    }
                    else {
                        node.documentObject.setAttribute(id, bf(node));
                    }
                }
            }
            else {
                for (let i = 0; i < ilen; i++) {
                    let node = this.nodes[i];

                    if (isCheck) {
                        let state = f;

                        if (state.toString().toLowerCase() === "checked" || state === true) {
                            node.documentObject.setAttribute("checked", "checked");
                            node.documentObject.checked = false;
                        }
                        else {
                            node.documentObject.setAttribute("checked", "");
                            node.documentObject.checked = false;
                        }
                    }
                    else if (isDisabled) {
                        node.documentObject.disabled = f;
                    }
                    else {
                        node.documentObject.setAttribute(id, f);
                    }
                }
            }

            return this;
        };

        this.call = function* (func) {
            let ilen = this.nodes.length;

            for (let i = 0; i < ilen; i++) {
                let node = this.nodes[i];

                let bfunc = func.bind(node.documentObject);

                yield bfunc(node);
            }

            return this;
        };


        this.clone = function ( newParent, nodes ) {

            let el = new Element(newParent, this.tagName, this.funcs.dataFunc, this.comparer, this.id);
            el.funcs = this.funcs.clone();

            let ilen = this.children.length;

            for (let i = 0; i < ilen; i++) {
                let child = this.children[i].clone(el);
                el.children.push(child);
            }

            return el;
        }

        this.copyContent = function () {
            let buf = document.createElement("textarea");
            buf.style.position = "absolute";
            buf.style.top = "-9999px";
            buf.style.left = "-9999px";

            document.body.appendChild(buf);

            let ilen = this.nodes.length;

            for (let i = 0; i < ilen; i++) {
                let node = this.nodes[i];

                
                buf.value += node.documentObject.innerHTML;
                buf.select();
                buf.setSelectionRange(0, 99999);
            }

            document.execCommand("copy");

            document.body.removeChild(buf);

        };

        this.data = function (d = null) {


            if (d === null) {
                return this.funcs.dataFunc;
            }

            this.funcs.dataFunc = d;

            if (this.parent !== null) {
                this.parent.update();
            }
            else {
                this.update();
            }

            return this;
        };

        this.execute = function (f = null) {

            if (f === null) {
                return this.funcs.textFunc;
            }

            let ilen = this.nodes.length;

            if (typeof f === 'function') {
                for (let i = 0; i < ilen; i++) {
                    let node = this.nodes[i];
                    let bf = f.bind(node.documentObject);
                    bf(node);
                }
            }

            return this;
        };

        this.highlight = function (color, ms) {

            let ilen = this.nodes.length;

            for (let i = 0; i < ilen; i++) {
                let node = this.nodes[i];

                let bgcolor = node.documentObject.style.backgroundColor;

                node.documentObject.style.backgroundColor = color;

                if (ms !== undefined || ms > -1) {
                    setTimeout(function () { node.documentObject.style.backgroundColor = bgcolor; }, ms);
                }
            }
        };


        this.on = function (str, f = null, stopPropagation = false) {

            let funcEntry = new HandlerEntry(str, f, stopPropagation);

            if (str === null) {
                return funcs.eventFuncs;
            }

            this.funcs.eventFuncs.push(funcEntry);

            if (typeof f === 'function') {

                let ilen = this.nodes.length;


                for (let i = 0; i < ilen; i++) {
                    let node = this.nodes[i];
                    node.addHandler(str, f);
                }
            }


            return this;
        };

        this.scrollLeft = function (f) {
            let ilen = this.nodes.length;

            if (typeof f === 'function') {
                for (let i = 0; i < ilen; i++) {
                    let node = this.nodes[i];
                    let bf = f.bind(node.documentObject);
                    node.scrollLeft(bf(node));
                }
            }
            else {
                for (let i = 0; i < ilen; i++) {
                    let node = this.nodes[i];
                    node.scrollLeft(f);
                }
            }

            return this;
        }

        this.scrollTop = function (f) {
            let ilen = this.nodes.length;

            if (typeof f === 'function') {
                for (let i = 0; i < ilen; i++) {
                    let node = this.nodes[i];
                    let bf = f.bind(node.documentObject);
                    node.scrollTop(bf(node));
                    //node.documentObject.style[id] = bf(node);
                }
            }
            else {
                for (let i = 0; i < ilen; i++) {
                    let node = this.nodes[i];
                    node.scrollTop(f);
                }
            }

            return this;
        }

        this.style = function (id = null, f = null) {

            if (id === null) {
                return funcs.styleFuncs;
            }

            this.funcs.setStyle(id, f);

            let ilen = this.nodes.length;

            if (typeof f === 'function') {
                for (let i = 0; i < ilen; i++) {
                    let node = this.nodes[i];
                    let bf = f.bind(node.documentObject);
                    node.documentObject.style[id] = bf(node);
                }
            }
            else {
                for (let i = 0; i < ilen; i++) {
                    let node = this.nodes[i];
                    node.documentObject.style[id] = f;
                }
            }

            return this;
        };

        this.text = function (f = null) {

            if (f === null) {
                return this.funcs.textFunc;
            }

            this.funcs.textFunc = f;

            let ilen = this.nodes.length;

            if (typeof f === 'function') {
                for (let i = 0; i < ilen; i++) {
                    let node = this.nodes[i];
                    let bf = f.bind(node.documentObject);
                    node.textNode.nodeValue = bf(node);
                }
            }
            else {
                for (let i = 0; i < ilen; i++) {
                    let node = this.nodes[i];
                    node.textNode.nodeValue = f;
                }
            }

            return this;
        };

        this.update = function (f = null) {

            if (f !== null) {
                this.funcs.updateFunc = f;
            }

            let ilen = this.nodes.length;

            for (let i = 0; i < ilen; i++) {
                let node = this.nodes[i];
                node.update();
            }

            return this;
        };

        this.updateNode = function (node) {

            if (funcs.textFunc !== null) {
                if (typeof funcs.textFunc === 'function') {
                    let bf = funcs.textFunc.bind(node.documentObject);
                    node.textNode.nodeValue = bf(node);
                }
                else {
                    node.textNode.nodeValue = funcs.textFunc;
                }
            }

            if (funcs.valueFunc !== null) {
                if (typeof funcs.valueFunc === 'function') {
                    let bf = funcs.valueFunc.bind(node.documentObject);
                    node.documentObject.value = bf(node);
                }
                else {
                    node.documentObject.value = funcs.valueFunc;
                }
            }

            let ilen = funcs.styleFuncs.length;

            for (let i = 0; i < ilen; i++) {

                let entry = funcs.styleFuncs[i];

                if (typeof entry.func === 'function') {

                    let bf = entry.func.bind(node.documentObject);
                    node.documentObject.style[entry.id] = bf(node);

                }
                else {
                    node.documentObject.style[entry.id] = entry.func;
                }
            }

            ilen = funcs.attributeFuncs.length;

            for (let i = 0; i < ilen; i++) {
                let entry = funcs.attributeFuncs[i];

                let isCheck = false;
                let isDisabled = false;
                if (entry.id.toLowerCase() === "checked") { isCheck = true; }
                if (entry.id.toLowerCase() === "disabled") { isDisabled = true; }

                if (typeof entry.func === 'function') {
                    let bf = entry.func.bind(node.documentObject);
                    

                    if (isCheck) {
                        let state = bf(node);

                        if (state.toString().toLowerCase() === "checked" || state === true) {
                            node.documentObject.setAttribute("checked", "checked");
                            node.documentObject.checked = true;
                        }
                        else {
                            node.documentObject.setAttribute("checked", "");
                            node.documentObject.checked = false;
                        }
                    }
                    if (isDisabled) {
                        node.documentObject.disabled = bf(node);
                    }
                    else {
                        node.documentObject.setAttribute(entry.id, bf(node));
                    }

                }
                else {
                    if (isCheck) {
                        let state = entry.func;

                        if (state.toString().toLowerCase() === "checked" || state === true) {
                            node.documentObject.setAttribute("checked", "checked");
                            node.documentObject.checked = true;
                        }
                        else {
                            node.documentObject.setAttribute("checked", "");
                            node.documentObject.checked = false;
                        }
                    }
                    if (isDisabled) {
                        node.documentObject.disabled = entry.func;
                    }
                    else {
                        node.documentObject.setAttribute(entry.id, entry.func);
                    }
                }
            }

            ilen = funcs.eventFuncs.length;

            node.removeHandlers();

            for (let i = 0; i < ilen; i++) {
                let entry = funcs.eventFuncs[i];
                node.addHandler(entry.id, entry.func);
            }

        };

        this.value = function (f = null) {
            if (f === null) {
                return this.funcs.valueFunc;
            }

            this.funcs.valueFunc = f;

            let ilen = this.nodes.length;

            if (typeof f === 'function') {
                for (let i = 0; i < ilen; i++) {
                    let node = this.nodes[i];
                    let bf = f.bind(node.documentObject);
                    node.documentObject.value = bf(node);
                }
            }
            else {
                for (let i = 0; i < ilen; i++) {
                    let node = this.nodes[i];
                    node.documentObject.value = f;
                }
            }

            return this;
        };

    }

    function FunctionHolder() {
        this.createFunc = null;
        this.attributeFuncs = [];
        this.eventFuncs = [];
        this.styleFuncs = [];
        this.tag = function () { return "div"; };
        this.textFunc = "";
        this.valueFunc = null;
        this.updateFunc = null;
        this.dataFunc = null;
        this.markedForDeletion = false;

        this.clone = function () {
            let fholder = new FunctionHolder();
            fholder.textFunc = this.textFunc;
            fholder.valueFunc = this.valueFunc;
            fholder.tag = this.tag;
            fholder.updateFunc = this.updateFunc;
            fholder.dataFunc = this.dataFunc;

            // Deep copy event attribute functions.
            let ilen = this.eventFuncs.length;
            let earr = new Array(ilen);

            for (let i = 0; i < ilen; i++) {
                earr[i] = new FunctionEntry(this.eventFuncs[i].id, this.eventFuncs[i].func);
            }

            fholder.eventFuncs = earr;

            // Deep copy style functions.
            ilen = this.styleFuncs.length;
            let sarr = new Array(ilen);


            for (let i = 0; i < ilen; i++) {
                sarr[i] = new FunctionEntry(this.styleFuncs[i].id, this.styleFuncs[i].func);
            }

            fholder.styleFuncs = sarr;

            // Deep copy attribute functions.
            ilen = this.attributeFuncs.length;
            let atarr = new Array(ilen);

            for (let i = 0; i < ilen; i++) {
                atarr[i] = new FunctionEntry(this.attributeFuncs[i].id, this.attributeFuncs[i].func);;
            }

            fholder.attributeFuncs = atarr;

            return fholder;
        }

        this.setAttribute = function (id, func) {

            let ilen = this.attributeFuncs.length;
            let i = 0;

            for (i = 0; i < ilen; i++) { // Check id attribute exists.
                if (this.attributeFuncs[i].id === id) { // Since it exists, set its value to new function.
                    this.attributeFuncs.func = func;
                    break;
                }
            }

            if (i === ilen) { // Did not exist so add it.
                let entry = new FunctionEntry(id, func);
                this.attributeFuncs.push(entry);
            }
        };

        this.setStyle = function (id, func) {

            let ilen = this.styleFuncs.length;
            let i = 0;

            for (i = 0; i < ilen; i++) { // Check id style exists.

                if (this.styleFuncs[i].id === id) { // Since it exists, set its value to new function.
                    this.styleFuncs[i].func = func;
                    break;
                }
            }

            if (i === ilen) { // Di=d not exist so add it.
                let entry = new FunctionEntry(id, func);
                this.styleFuncs.push(entry);
            }
        };
    }

    function FunctionEntry(id, func) {
        this.id = id;
        this.func = func;
    }

    function Group(node, element) {
        this.parentNode = node;
        this.nodes = [];
        this.element = element;
        this.isSVG = false;

        let tag = "div";
        let ns = this.parentNode.documentObject.namespaceURI;

        // If the namesapce is SVG, the group has to be under a "g" element.
        if (ns !== null && ns.toLowerCase() === "http://www.w3.org/2000/svg") {
            tag = "g";
            this.isSVG = true;
        }

        if (ns !== null) {
            this.documentObject = document.createElementNS(ns, tag);
        }
        else {
            this.documentObject = document.createElement(tag);
        }

        if (!this.isSVG) {
            this.documentObject.style.display = "contents";
        }
        
        this.createNode = function (datum, index) {
            let newNode = new Node(this.element, this.parentNode, datum, index);

            setValues(newNode, this.element.funcs);

            let ilen = this.element.children.length;

            for (let i = 0; i < ilen; i++) {
                newNode.createGroup(this.element.children[i]);
            }

            return newNode;
        };

        this.parentNode.documentObject.appendChild(this.documentObject);

        this.addNode = function (node) {

            this.nodes.push(node);
            this.element.nodes.push(node);
        };

        this.appendToDocument = function (node) {


            // The grouping element is to maintain proper sequence if data is updated.
            // Some elements have to be contained in the original parent, not the auto generated grouping element.
            // For now all SVG elements are treated this way.
            if (this.element.comparer !== null && node.index < this.nodes.length) {

                if (this.isSVG || this.parentNode.tagName.toLowerCase() === "select") {
                    this.parentNode.documentObject.insertBefore(node, documentObject, this.nodes[node.index].documentObject);
                }
                else {
                    this.documentObject.insertBefore(node.documentObject, this.nodes[node.index].documentObject);
                }
                /*
                for (let i = node.index; i < this.nodes.length; i++) { //Set indexes after the one inserted.
                    this.nodes[i].index = i;
                }*/
            }
            else {

                if (this.isSVG || this.parentNode.tagName.toLowerCase() === "select") {
                    this.parentNode.documentObject.appendChild(node.documentObject);
                }
                else {
                    this.documentObject.appendChild(node.documentObject);
                }
            }

            //If there is a sort function, the DOM object has to be inserted in the right place.

        };


        this.generateNodes = function () { // Generate Nodes.

            let d = this.element.funcs.dataFunc;

            let dat = null;
            if (d === null) { // The node is a static child.
                dat = this.parentNode.datum; // The datum is the same as the parents. Prevents having to climb up tree to find datum.
            }
            else if (typeof d === "function") {
                let bn = d.bind(this.parentNode.documentObject);
                dat = bn(this.parentNode);
            }
            else {
                dat = d;
            }

            if (!(dat instanceof Array)) { //If it's not an array, a single node needs to be created.
                if (this.nodes.length === 0) { //No nodes in group means the node was never created.
                    let node = this.createNode(dat, 0); // Index is 0 since there is only one node in branch.
                    this.appendToDocument(node);
                    this.addNode(node);
                }
            }
            else { // If it is an array, we generate node for each datum.

                if (this.element.comparer !== null) {// The element sorts its data. So make sure its properly sorted.
                    dat.sort(this.element.comparer);
                }

                let ilen = dat.length;

                for (let i = 0; i < ilen; i++) {
                    let node = this.createNode(dat[i], i); // Node index is that of the datum's index in array.
                    this.appendToDocument(node);
                    this.addNode(node);
                }
            }
        };

        this.update = function () { // Update and initial generation is same code block due to similarities.

            let d = this.element.funcs.dataFunc;
            let dat = null;
            let ilen = 0;
            let jlen = 0;
            let i = 0;
            let j = 0;


            if (d === null) { // The node is a static child.
                dat = this.parentNode.datum; // The datum is the same as the parents. Prevents having to climb up tree to find datum.
            }
            else if (typeof d === "function") {
                let bn = d.bind(this.parentNode.documentObject);
                dat = bn(this.parentNode);
            }
            else {
                dat = d;
            }

            if (!(dat instanceof Array)) { //If it's not an array, a single node needs to be created.
                if (this.nodes.length === 0) { // No nodes in group means the node was never created.
                    let node = this.createNode(dat, 0); // Index is 0 since there is only one node in branch.
                    this.appendToDocument(node);
                    this.addNode(node);
                }
                else { // Check if the data of the element is still the same as that of the nodes datum.
                    if (dat !== this.nodes[0].datum) {
                        this.nodes[0].datum = dat;
                    }
                }
            }
            else { // If it is an array, we need to check if there is a node for each datum.
                
                if (this.element.comparer !== null) {// The element sorts its data. So make sure its properly sorted.
                    dat.sort(this.element.comparer);
                    this.nodes.sort((a, b) => this.element.comparer(a.datum, b.datum)); // Nodes have to be sorted as well.
                }

                ilen = dat.length;
                jlen = this.nodes.length;

                let repNodes = new Array(ilen); //the number of nodes shpould equal the number of items in the data set.

                for (j = 0; j < jlen; j++) { // Remove nodes that do not correspond to anything in the data.
                    let node = this.nodes[j];

                    for (i = 0; i < ilen; i++) {

                        if (node.datum === dat[i]) {
                            break;
                        }
                    }

                    if (i === ilen) { // Node corrresponding to datum is no longer in data, so remove it and its DOM.

                        // The node has to be removed from the element that generated it.
                        let klen = node.element.nodes.length;

                        let k = 0;

                        for (k = 0; k < klen; k++) {
                            if (node.element.nodes[k] === node) {
                                node.element.nodes.splice(k, 1);
                                klen--;
                                break;
                            }
                        }

                        /*
                        while (k < klen) { // Reset the index of the nodes after the one removed.
                            node.element.nodes[k].index = k;
                            k++;
                        }
                        */

                        // Some elements have to be contained in the original parent, not this grouping element.
                        // For now all SVG elements are treated this way.

                        if (this.isSVG || this.parentNode.tagName.toLowerCase() === "select") {
                            this.parentNode.documentObject.removeChild(node.documentObject);
                        }
                        else {

                            this.documentObject.removeChild(node.documentObject);
                        }

                        //this.nodes.splice(j, 1);

                        //jlen--;
                        //j--;
                    }

                }

                for (i = 0; i < ilen; i++) {

                    for (j = 0; j < jlen; j++) {
                        if (this.nodes[j].datum === dat[i]) {
                            repNodes[i] = this.nodes[j];
                            break;
                        }
                    }

                    if (j === jlen) { // The datum is not in the array of nodes. 
                        let node = this.createNode(dat[i], i); // Node index is that of the datum's index in array.
                        this.appendToDocument(node);
                        this.element.nodes.push(node);
                        repNodes[i] = node;
                        //repNodes[i].index = i;
                        //this.addNode(node);
                    }

                    repNodes[i].index = i;
                }

                this.nodes = repNodes;
            }

            ilen = this.nodes.length;

            for (let i = 0; i < ilen; i++) {
                this.nodes[i].update(); // Call the functions recursevely to create all children.
            }

            
        };


        return;

        /*
        //Generate nodes based on data function of element.
        if (this.element.d === null) { // Just a single node.
            this.createNode(this.parentNode.datum, 0);
        }
        else if (this.element.d instanceof Array) { // Nodes are created based on an array.
            let ilen = this.element.d.length;

            for (let i = 0; i < ilen; i++) {
                this.createNode(this.element.d[i], i);
            }

        }
        else if (typeof this.element.d === "function") { // Nodes are functionally created.
            let bn = this.element.d.bind(this.element);
            let arr = bn(this.parentNode);

            let ilen = arr.length;

            for (let i = 0; i < ilen; i++) {
                this.createNode(arr[i], i);
            }

        }
        */

    }

    function HandlerEntry(id, func, propagate) {
        this.id = id;
        this.func = func;
        this.propagate = propagate;
    }

    function insert(t = "div", d = null, c = null, id = null) {

        let element = null;

        if (t instanceof Element) {
            let p = t;

            while (p.parent !== null) {
                p = p.parent;
            }

            element = p.clone(null);
        }
        else {
            element = new Element(null, t, d, c, id);
        }

        // Insert the node where the script is being called from.

        let script = document.scripts[document.scripts.length - 1];

        let node = new Node(element, null, script.parentNode);

        script.parentElement.insertBefore(node.documentObject, script);

        let g = node.createGroup(element);
        g.generateNodes();

        element.update();

        return element;
    }

    function Node(element, parent = null, datum = null, index = -1) {

        let ns = "";


        this.textNode = document.createTextNode("");
        this.parent = parent;
        this.group = null;
        this.datum = datum;
        this.groups = [];
        this.children = [];
        this.element = element;
        this.handlers = [];
        this.index = index;

        if (typeof element.tagName === "function") {
            this.tagName = element.tagName(this);
        }
        else {
            this.tagName = element.tagName;
        }

        if (this.tagName.toLowerCase() === "svg") {
            ns = "http://www.w3.org/2000/svg";
        }
        else if (parent !== null) {
            ns = parent.documentObject.namespaceURI;
        }

        this.documentObject = document.createElementNS(ns, this.tagName);

        if (this.tagName !== "empty") {
            this.documentObject.appendChild(this.textNode);
        }

        if (parent !== null) {
            if (this.tagName !== "empty") {
                //this.parent.documentObject.appendChild(this.documentObject);
            }
            this.parent.children.push(this);
        }

        this.addHandler = function (id, f, stopPropagation) {
            var that = this;
            var func = function () {
                let bf = f.bind(that.documentObject);
                bf(that, event);
            };

            let entry = new HandlerEntry(id, func, stopPropagation);
            this.handlers.push(entry);

            this.documentObject.addEventListener(id, entry.func, stopPropagation);
        };

        /*
        this.createChild = function (element, datum, index) {
            let node = new Node(element, this, datum, index);
            setValues(node, element.funcs);

            return node;
        };
        */

        this.clone = function (element) {
            let newNode = new Node(element, this.parent, this.datum, this.index);
            let g = newNode.createGroup(element);
            g.generateNodes();

            return newNode;
        }

        this.createGroup = function (element) {
            let g = new Group(this, element);
            this.groups.push(g);
            return g;
        };

        
        this.removeHandlers = function () {
            let ilen = this.handlers.length;

            for (let i = 0; i < ilen; i++) {
                let entry = this.handlers[i];

                this.documentObject.removeEventListener(entry.id, entry.func, false);
            }
        };

        this.scrollLeft = function (x) {
            this.documentObject.scrollLeft = x;
        }

        this.scrollTop = function ( y ) {
            this.documentObject.scrollTop = y;
        }

        this.update = function () {

            setValues(this, this.element.funcs);

            let ilen = this.groups.length;

            for (let i = 0; i < ilen; i++) {
                let g = this.groups[i];
                g.update();
            }

            //updateNode(this, this.element);
        };
       
    }



    function select(selector, datum = null) {

        let dom = null;

        if (typeof selector === "string") {
            let str = selector.substr(0, 1);
            let sel = selector.substr(1);
            if (str === "#") {
                dom = document.getElementById(sel);
            }
        }
        else {
            dom = selector;
        }

        if (datum === null) {
            datum = dom;
        }

        let element = new Element(null, dom.tagName);
        let node = new Node(element, null, datum);
        //A full solution would read the entire DOM under the one selected and create Vister object from them.

        if (dom.childNodes.length > 0)
            node.textNode = dom.childNodes[0];
        else {
            dom.appendChild(node.textNode);
        }
        //Add something here!!!!

        node.documentObject = dom;
        element.nodes.push(node);

        return element;
    }

    function ZPDColor(val) {
        let x = 1 / (1 + (Math.pow(Math.E, -8 * (val - (Math.PI / 4)))));
        return "hsl(" + Math.round(240 * x) + ",100%,50%)";
    }


    // Widgets

    function Widget_Time() {
        let element = new Element()
            .append("div").text("00").append("input").text("01");
            //.style("color", "red");

        return element;
    }

    return {
        select: select,
        insert: insert,
        Element: Element,
        ZPDColor: ZPDColor,
        Widgets: {
            Time: Widget_Time
        }

    };
})();


