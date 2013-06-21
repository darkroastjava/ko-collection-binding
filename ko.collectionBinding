if (!ko) {
    return 'knockout must be included before this file';
}

ko.collectionBinding = (function (ko) {
    var BindingSource = function (data) {
        this.rows = ko.observableArray(data);
        this.currentlySortedBy = ko.observable(null);
    },
        comparerForProperty = function (property) {
            return function (left, right) {
                return left[property] == right[property] ? 0 : left[property] < right[property] ? -1 : 1;
            };
        },
        sorters = {},
        Sorter = function (property, dataGrid) {
            var self = this,
                state = ko.observable(false),
                compare = dataGrid.comparerForProperty(property),
                sort = function () {
                    if (dataGrid.currentlySortedBy() && dataGrid.currentlySortedBy() != property) {
                        sorters[dataGrid.currentlySortedBy()].state(null);
                    }
                    dataGrid.currentlySortedBy(property);
    
                    if (state() === 'asc') {
                        state('desc');
                        dataGrid.rows.sort(function (left, right) {
                            return compare(right, left);
                        });
                    } else {
                        state('asc');
                        dataGrid.rows.sort(compare);
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
        var sorter = sorters[property];

        if (!sorter) {
            sorter = sorters[property] = new Sorter(property, this);
        }

        return sorter;
    };

    return {
        BindingSource: BindingSource
    };
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
