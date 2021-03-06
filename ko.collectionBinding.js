if (!ko) {
    return 'knockout must be included before this file';
}

ko.collections = ko.collections || {};

ko.collections.DataSource = (function (ko) {
    var DataSource = function (data) {
        this.items = data;
        this.subscribersForAdd = [];
        this.subscribersForRemove = [];
    };

    DataSource.prototype.notifyAdd = function (newItem) {
        var i, n, subscribers = this.subscribersForAdd;
        
        for (i = 0, n = subscribers.length; i < n; i++) {
            subscribers[i](newItem);
        }
    };
    
    DataSource.prototype.notifyRemove = function (itemRemoved) {
        var i, n, subscribers = this.subscribersForRemove;
        
        for (i = 0, n = subscribers.length; i < n; i++) {
            subscribers[i](itemRemoved);
        }
    };
    
    DataSource.prototype.addItem = function (newItem) {
        this.items.push(newItem);
        this.notifyAdd(newItem);
    };
    
    DataSource.prototype.deleteItem = function (itemToDelete) {
        var index = this.items.indexOf(itemToDelete);
        this.items.splice(index, 1);
        this.notifyRemove(itemToDelete);
    };
    
    DataSource.prototype.subscribeForAdd = function (callback) {
        this.subscribersForAdd.push(callback);
    };
    
    DataSource.prototype.subscribeForRemove = function (callback) {
        this.subscribersForRemove.push(callback);
    };
    
    DataSource.prototype.getItems = function () {
        return this.items.slice(0); // clone
    };
    
    return DataSource;
}(ko));

ko.collections.BindingItem = (function (ko) {
    var BindingItem = function(item, bindingSource) {
        var self = this;
        
        for (var prop in item) {
            if (item.hasOwnProperty(prop)) {
                self[prop] = item[prop];
            }
        }
        
        self.bindingSource = bindingSource;
        self.deleteItem = function() {
            bindingSource.deleteItem(self);
        };
        self.originalItem = item;
    };
    
    return BindingItem;
}(ko));

ko.collections.BindingSource = (function (ko) {
    var BindingSource = function (dataSource) {
        var self = this,
            addItem = function(newItem) {
                var currentlySortedBy = self.currentlySortedBy(),
                    sorter;
                
                self.items.push(
                    new ko.collections.BindingItem(newItem, self)
                );
                
                if (currentlySortedBy) {
                    sorter = self.sorters[currentlySortedBy];
                    
                    if (sorter.state() === 'desc') {
                        sorter.state('asc');
                    } else {
                        sorter.state(null);
                    }
                    
                    sorter.sort();
                }
            },
            dataSourceItems = dataSource.getItems(),
            i,
            n;
        
        self.dataSource = dataSource;
        self.items = ko.observableArray();
        self.currentlySortedBy = ko.observable(null);
        self.sorters = {};
        
        for (i = 0, n = dataSourceItems.length; i < n; i++) {
            addItem(dataSourceItems[i]);
        }
        
        dataSource.subscribeForAdd(addItem);
        dataSource.subscribeForRemove(function (itemRemoved) {
            var i, n, items = self.items, index = -1;
            
            for (i = 0, n = items().length; i < n; i++) {
                console.log(items()[i].originalItem.name);
                if (items()[i].originalItem == itemRemoved) {
                    index = i;
                    break;
                }
            }
            
            if (index > -1) {
                items.splice(index, 1);
            }
        });
    },
        comparerForProperty = function (property) {
            return function (left, right) {
                return left[property] == right[property] ? 0 : left[property] < right[property] ? -1 : 1;
            };
        },
        Sorter = function (property, bindingSource, sorters) {
            var self = this,
                state = ko.observable(false),
                compare = bindingSource.comparerForProperty(property),
                sort = function () {
                    if (bindingSource.currentlySortedBy() && bindingSource.currentlySortedBy() != property) {
                        sorters[bindingSource.currentlySortedBy()].state(null);
                    }
                    bindingSource.currentlySortedBy(property);
                    
                    if (state() === 'asc') {
                        state('desc');
                        bindingSource.items.sort(function (left, right) {
                            return compare(right, left);
                        });
                    } else {
                        state('asc');
                        bindingSource.items.sort(compare);
                    }
                };
            
            self.state = state;
            self.isAsc = ko.computed(function () {
                return state() == "asc";
            });
            self.isDesc = ko.computed(function () {
                return state() == "desc";
            });
            self.isNotSorted = ko.computed(function () {
                return !state();
            });
            self.sort = sort;
        };
   
    BindingSource.prototype.comparerForProperty = comparerForProperty;

    BindingSource.prototype.sorter = function (property) {
        var sorter = this.sorters[property];

        if (!sorter) {
            sorter = this.sorters[property] = new Sorter(property, this, this.sorters);
        }

        return sorter;
    };
    
    BindingSource.prototype.deleteItem = function(itemToDelete) {
        this.dataSource.deleteItem(itemToDelete.originalItem);
    };

    return BindingSource;
}(ko));

ko.bindingHandlers.sortableBy = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        // This will be called when the binding is first applied to an element
        // Set up any initial state, event handlers, etc. here

        // First get the latest data that we're bound to
        var sortProperty = ko.utils.unwrapObservable(valueAccessor()),
            sorter = bindingContext.$data.sorter(sortProperty);

        ko.bindingHandlers.click.init(
            element,
            function () {
                return sorter.sort;
            },
            allBindingsAccessor,
            viewModel,
            bindingContext
        );

        ko.applyBindingsToNode(
            element,
            {
                css: {
                    sortable: true,
                    sorted_asc: sorter.isAsc,
                    sorted_desc: sorter.isDesc,
                    not_sorted: sorter.isNotSorted
                }
            },
            bindingContext.$data
        );
    }
};
