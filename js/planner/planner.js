let root_project_task = null;

function ToggleDependencies()
{
    // $(root_project_task.svg.edge_group).toggle("slow");
}

function ZoomIn()
{
    let html = document.querySelector("html");
    let htmlStyles = window.getComputedStyle(html);
    let pix_per_day = htmlStyles.getPropertyValue("--pixels-per-day");
    html.style.setProperty("--pixels-per-day", pix_per_day *= 1.5);
}

function ZoomOut()
{
    let html = document.querySelector("html");
    let htmlStyles = window.getComputedStyle(html);
    let pix_per_day = htmlStyles.getPropertyValue("--pixels-per-day");
    html.style.setProperty("--pixels-per-day", pix_per_day *= 0.75);
}

function ExpandAll()
{
    $(".task:not([data-numchildren='0'])").addClass('expanded');
}

function CollapseAll()
{
    $('.expanded').removeClass('expanded');
}

function Focus(task)
{

}

function GetSelectedTaskUid()
{
    // Find selected element in DOM.
    let uid = $('.selected')[0].dataset.uid;
    return uid;
}

function SwapNodes(a, b) {
    var aparent = a.parentNode;
    var asibling = a.nextSibling === b ? a : a.nextSibling;
    b.parentNode.insertBefore(a, b);
    aparent.insertBefore(b, asibling);
}

function NewTask()
{
    let uid = GetSelectedTaskUid();
    let task = root_project_task.uid_map[uid];
    if(task) {
        let new_uid = NewUid();
        let new_task = new Task(new_uid, new_uid, '', 1);
        root_project_task.uid_map[new_uid] = new_task;

        if(task._parent)  {
            // Add as sibling
            let idx = task.ChildIndexInParent();
            task._parent.AddChild(new_task, idx+1);

            $("[data-uid='"+task._parent.uid+"'] > .children").each(function(){
                // Create new DOM task
                let eltask = $('#templates > .task').clone();
                eltask[0].dataset.uid = new_uid;
                AddTaskEvents(eltask, new_task);
                let elsib = $(this).find("> [data-uid='"+uid+"']");
                elsib[0].after(eltask[0]);
            });
            ComputeSchedule();
            UpdateRootElementFromProject($('html'), root_project_task);
        }else{
            // No parent - add as child.
            task.AddChild(new_task);

            $("[data-uid='"+task.uid+"'] > .children").each(function(){
                // Create new DOM task
                let eltask = $('#templates > .task').clone();
                eltask[0].dataset.uid = new_uid;
                AddTaskEvents(eltask, new_task);
                $(this).append(eltask[0]);
            });
            ComputeSchedule();
            UpdateRootElementFromProject($('html'), root_project_task);
        }
    }
}

function TaskMoveUp()
{
    let uid = GetSelectedTaskUid();
    let task = root_project_task.uid_map[uid];

    if(task && task._parent)  {
        let idx = task.ChildIndexInParent();
        if(idx > 0) {
            let prev_sibling = task._parent.children[idx-1];
            task._parent.children[idx-1] = task;
            task._parent.children[idx] = prev_sibling;

            // Update all applicable DOM elements.
            $("[data-uid='"+uid+"']").each(function(){
                let eltask = $(this);
                let elsib = eltask.prevAll("[data-uid='"+prev_sibling.uid+"']");
                SwapNodes(eltask[0], elsib[0])
            });
        }
    }
}

function TaskMoveDown()
{
    let uid = GetSelectedTaskUid();
    let task = root_project_task.uid_map[uid];

    if(task && task._parent)  {
        let idx = task.ChildIndexInParent();
        if(idx < task._parent.children.length-1) {
            let next_sibling = task._parent.children[idx+1];
            task._parent.children[idx+1] = task;
            task._parent.children[idx] = next_sibling;

            // Update all applicable DOM elements.
            $("[data-uid='"+uid+"']").each(function(){
                let eltask = $(this);
                let elsib = eltask.nextAll("[data-uid='"+next_sibling.uid+"']");
                SwapNodes(eltask[0], elsib[0])
            });
        }
    }
}

function TaskIndent()
{
    let uid = GetSelectedTaskUid();
    let task = root_project_task.uid_map[uid];

    if(task && task._parent)  {
        let idx = task.ChildIndexInParent();
        if(idx > 0) {
            let new_parent = task._parent.children[idx-1];

            // Update all applicable DOM elements.
            $("[data-uid='"+uid+"']").each(function(){
                let eltask = $(this);
                let elnp = eltask.prevAll("[data-uid='"+new_parent.uid+"']");
                let elnpc  = elnp.find("> .children");
                elnpc.append(eltask);
                elnp.addClass('expanded');
            });

            new_parent.AddChild(task);
        }
    }
    UpdateRootElementFromProject($('html'), root_project_task);
}

function TaskUndent()
{
    let uid = GetSelectedTaskUid();
    let task = root_project_task.uid_map[uid];

    if(task && task._parent && task._parent._parent) {
        // Update DOM first
        $("[data-uid='"+uid+"']").each(function(){
            let eltask = $(this);
            let elp  = eltask.parents("[data-uid='"+task._parent.uid+"']");
            elp.after(eltask);
        });

        let idx = task._parent.ChildIndexInParent()+1;
        task._parent._parent.AddChild(task, idx);
    }
    UpdateRootElementFromProject($('html'), root_project_task);
}

function TaskDelete()
{
    let uid = GetSelectedTaskUid();
    let task = root_project_task.uid_map[uid];

    if(task) {
        $("[data-uid='"+uid+"']").remove();
        task.DetachFromParent();

        // Remove tasks and children from uid_map;
        let ds = [task].concat(task.GetDescendents());
        ds.forEach(function(task){
            delete root_project_task.uid_map[task.uid];
        });
    }
    UpdateRootElementFromProject($('html'), root_project_task);
}

///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////

function FocusNextDurationElement(root_element, current_duration_element)
{
    let p = root_element;
    while(p && p.parentNode) {
        p = p.parentNode;
    }
    let ds = $(p).find('.duration');
    let idx = ds.index(current_duration_element);
    let next = idx+1;
    if( next < ds.length ) {
        // TODO: Also expand parent node so that this is visible.
        ds[next].focus();
    }
}

function AddTaskEvents(eltask, root_task)
{
    eltask.find('> .head > .name').on('click', function(){
        if( !$(eltask).hasClass('selected') ) {
            $('.selected').removeClass('selected');
            $(eltask).addClass('selected');
        }
    });

    // Add event handler
    eltask.find('> .head > .name').on('dblclick', function(){
        if( !$(eltask).hasClass('edit') ) {
            $('.edit').removeClass('edit');
            $('.selected').removeClass('selected');
            $(eltask).addClass('edit');
            $(eltask).addClass('selected');
        }else{
            $(eltask).removeClass('edit');
        }
    });

    // Add event handler
    eltask.find('> .head > .treeicon').on('click', function(){
        $(".task[data-uid='"+root_task.uid+"']").toggleClass('expanded');
    });

    // Prevent adding new lines.
    $(eltask.find('.name')).on('keypress',function(e){
        if(e.keyCode==13){
            e.preventDefault();
            let name = $(e.currentTarget).text();
            if(name != root_task.name) {
                root_task.SetName(name);
                UpdateRootElementFromProject($('html'), root_project_task);
            }
        }
    });

    // Prevent adding new lines.
    $(eltask.find('.duration')).on('keypress',function(e){
        if(e.keyCode==13){
            e.preventDefault();
            let dur = $(e.currentTarget).text();
            if(dur != root_task.duration_days) {
                root_task.SetDuration(dur);
                ComputeSchedule();
                // FocusNextDurationElement(root_element, e.currentTarget);
                UpdateRootElementFromProject($('html'), root_project_task);
            }
        }
    });

    // Prevent adding new lines.
    $(eltask.find('.notes')).on('blur',function(e){
        let txt = $(e.currentTarget).text();
        root_task.notes = txt;
        UpdateRootElementFromProject($('html'), root_project_task);
    });

    $(eltask.find('> .head')).on('copy',function(e){
        root_project_task.copy_uid = root_task.uid;
    });

    $(eltask.find('.depends')).on('paste',function(e){
        e.preventDefault();
        let uid = root_project_task.copy_uid;
        if(uid && root_project_task.uid_map[uid]) {
            if(root_task.depends.indexOf(uid) == -1) {
                root_task.depends.push(uid);
                ComputeSchedule();
                UpdateRootElementFromProject($('html'), root_project_task);
            }
        }
    });
}

function AppendProjectStructure(root_element, template_element, root_task, level)
{
    let eltask = $(template_element).clone().appendTo(root_element);
    let elchilds = eltask.find('.children')[0];
    eltask[0].dataset.uid = root_task.uid;

    for(let c=0; c < root_task.children.length; ++c) {
        AppendProjectStructure(elchilds, template_element, root_task.children[c], level+1);
    }

    AddTaskEvents(eltask, root_task);
}

function PopulateElementWithPlanner(root_element, root_task)
{
    // Remove previous DOM elements
    root_element.find("> div").remove();

    let template_element = $('#templates > .task');

    AppendProjectStructure( root_element, template_element, root_task, 0);
    UpdateRootElementFromProject( root_element, root_task);

    root_element.find(".task[data-uid='"+root_task.uid+"'] > .head").toggle();
    ExpandAll();
}

function UpdateRootElementFromProject(root_element, root_task)
{
    // Iterate over all tasks
    let tasks = [root_task].concat(root_task.GetDescendents());
    for(let t=0; t < tasks.length; ++t) {
        let task = tasks[t];
        // Update each view of task
        root_element.find(".task[data-uid='"+task.uid+"']").each(function(){
            let eltask = $(this);
            let ms_per_day = 1000 * 60 * 60 * 24;
            let parent_time_ms = task._parent ? task._parent._start_ms : TimeNow_ms();
            let rel_time_days = (task._start_ms - parent_time_ms) / ms_per_day;
            let duration_days = (task._end_ms - task._start_ms) / ms_per_day;
            eltask[0].style.setProperty("--duration-days", duration_days );
            eltask[0].style.setProperty("--relative-start-day", rel_time_days );

            // Update non-visible data
            let data = eltask[0].dataset;
            data.uid = task.uid;
            data.numchildren = task.children.length;

            // Populate visible data
            eltask.find('.name').text(task.name);
            eltask.find('.notes').text(task.notes);
            eltask.find('.duration').text( task.children.length == 0 && task.duration_days ? task.duration_days : Math.round(duration_days));
            eltask.find('.depends').text(task.depends.map(function(d){return '"'+root_project_task.uid_map[d].name+'"';}).join());
        });
    }
}

function PopulateSummary()
{
    // Remove existing table contents.
    $('#summary > table > tbody > tr').remove();

    // Put tasks in buckets
    let tasks = root_project_task.GetDescendents();
    let goals = tasks.filter(function (task, pos) {return task.goal > 0;});

    if(goals.length == 0) return;

    let start = new Date(goals.reduce(function(t1, t2) {
        return Math.min(t1._start_ms, t2._start_ms);
    }));
    let end = new Date(goals.reduce(function(t1, t2) {
        return Math.max(t1._end_ms, t2._end_ms);
    }));


    // Table should be between start and end

    console.debug(goals);

    let body = $('#summary > table > tbody');

    for(let i=0; i < 100; ++i) {
        let row = "<tr><td>testing</td></td>";
        body.append(row);
    }
}

///////////////////////////////////////////////////////////////////////////////
// Scheduling
///////////////////////////////////////////////////////////////////////////////

function GetDependencies(task)
{
    let d = [];
    task.depends.forEach(function(uid){
        d.push(root_project_task.uid_map[uid]);
    });
    return d;
};

// https://en.wikipedia.org/wiki/Topological_sorting
function GetTopologicalTaskOrdering(root_project_task)
{
    let unmarked = [root_project_task].concat(root_project_task.GetDescendents());
    let ordered = [];
    unmarked.forEach(function(task){task._topo_ordering=null;});

    // Build depentends
    let dependents = {};
    unmarked.forEach(function(task){
        dependents[task.uid] = [];
    });
    unmarked.forEach(function(task){
        task.depends.forEach(function(d){
            dependents[d].push(task);
        });
    });
    let GetDependents = function(task)
    {
        return dependents[task.uid];
    };

    let Visit = function(n) {
        if(n._topo_ordering == 'permanent') return;
        if(n._topo_ordering == 'temporary') throw "Not a DAG.";

        n._topo_ordering = 'temporary';
        let dependents = GetDependents(n);
        dependents.forEach(function(m){
            Visit(m);
        });
        n._topo_ordering = 'permanent';
        ordered.unshift(n);
    };

    while(unmarked.length > 0) {
        Visit(unmarked.pop());
    }

    // // Add back in root.
    // ordered.unshift(root_project_task);

    return ordered;
}

function AddWeekdays(start_ms, days)
{
    if(!days || days < 0) {
        return start_ms;
    }

    let date = moment(start_ms).add(Math.floor(Math.abs(days) / 5) * 7, 'days');
    let remaining_days = days % 5;
    while(remaining_days != 0) {
      date.add(1, 'days');
      if(date.isoWeekday() !== 6 && date.isoWeekday() !== 7) {
          remaining_days -= 1;
      }
    }
    return date.valueOf();
}

function ComputeSchedule()
{
    let L = GetTopologicalTaskOrdering(root_project_task);

    // Iterate over tasks in topological order such that all dependencies
    // will have been calculated before t.
    for(let i=0; i < L.length; ++i) {
        let t = L[i];

        let depend_ms = GetDependencies(t).map(function(x){return x._end_ms});

        if(t.started_date) {
            depend_ms.push(t.started_date.valueOf());
        }else{
            depend_ms.push(TimeNow_ms());
        }

        let earliest_start_ms = depend_ms.reduce(function(r,v){
            return Math.max(r, v);
        });

        if(t.is_anchor && t.started_date) {
            t._start_ms = t.started_date.valueOf();
            if( t._start_ms < earliest_start_ms) {
                console.debug(t.name + " inconsistent timing.");
            }
        }else{
            t._start_ms = earliest_start_ms;
        }

        t._end_ms = AddWeekdays(t._start_ms, t.duration_days);
    }

    root_project_task.UpdateStartEndCache();
}

///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////

function TimeNow_ms()
{
    return new Date().getTime();
}
