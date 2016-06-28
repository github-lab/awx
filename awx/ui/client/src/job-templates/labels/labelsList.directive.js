/* jshint unused: vars */
export default
    [   'templateUrl',
        'Wait',
        'Rest',
        'GetBasePath',
        'ProcessErrors',
        'Prompt',
        '$q',
        function(templateUrl, Wait, Rest, GetBasePath, ProcessErrors, Prompt, $q) {
            return {
                restrict: 'E',
                scope: false,
                templateUrl: templateUrl('job-templates/labels/labelsList'),
                link: function(scope, element, attrs) {
                    scope.showDelete = attrs.showDelete === 'true';
                    scope.seeMoreInactive = true;

                    var getNext = function(data, arr, resolve) {
                        Rest.setUrl(data.next);
                        Rest.get()
                            .success(function (data) {
                                if (data.next) {
                                    getNext(data, arr.concat(data.results), resolve);
                                } else {
                                    resolve.resolve(arr.concat(data.results));
                                }
                            });
                    };

                    scope.seeMore = function () {
                        var seeMoreResolve = $q.defer();
                        Rest.setUrl(scope[scope.$parent.list.iterator].related.labels);
                        Rest.get()
                            .success(function(data) {
                                if (data.next) {
                                    getNext(data, data.results, seeMoreResolve);
                                } else {
                                    seeMoreResolve.resolve(data.results);
                                }
                            });

                        seeMoreResolve.promise.then(function (labels) {
                            scope.labels = labels;
                            scope.seeMoreInactive = false;
                        });
                    };

                    scope.deleteLabel = function(templateId, templateName, labelId, labelName) {
                        var action = function () {
                            $('#prompt-modal').modal('hide');
                            Wait('start');
                            var url = GetBasePath("job_templates") + templateId + "/labels/";
                            Rest.setUrl(url);
                            Rest.post({"disassociate": true, "id": labelId})
                                .success(function () {
                                    Wait('stop');
                                    scope.search("job_template");
                                })
                                .error(function (data, status) {
                                    ProcessErrors(scope, data, status, null, { hdr: 'Error!',
                                        msg: 'Could not disacssociate label from JT.  Call to ' + url + ' failed. DELETE returned status: ' + status });
                                });
                        };

                        Prompt({
                            hdr: 'Remove Label from ' + templateName,
                            body: '<div class="Prompt-bodyQuery">Confirm  the removal of the <span class="Prompt-emphasis">' + labelName + '</span> label.</div>',
                            action: action,
                            actionText: 'REMOVE'
                        });
                    };

                    scope.$watch(scope.$parent.list.iterator+".summary_fields.labels.results", function() {
                        // To keep the array of labels fresh, we need to set up a watcher - otherwise, the
                        // array will get set initially and then never be updated as labels are removed
                        if (scope[scope.$parent.list.iterator].summary_fields.labels){
                            scope.labels = scope[scope.$parent.list.iterator].summary_fields.labels.results;
                            scope.count = scope[scope.$parent.list.iterator].summary_fields.labels.count;
                        }
                    });
                }
            };
        }
    ];
