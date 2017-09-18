class Task
{
    constructor(uid, name, notes, duration_days)
    {
        this.uid = uid;
        this.name = name;
        this.notes = "";
        this.children = [];
        this.depends = [];

        // input: Expected duration in days
        this.duration_days = duration_days;
        // input: Date at which the task was started, or null
        this.started_date = null;
        // input: If task should move with dependencies, or just warn if not-met.
        this.is_anchor = false;
        // input: Lazy iff task should sit at end of slack (instead of start).
        this.is_lazy = false;
        // input: What level of goal this is.
        this.goal = 0;

        // Cached options
        this._parent = null;
        this._start_ms = null;
        this._end_ms = null;

        // Used to store topological ordering temporary state
        this._topo_ordering = null;

        this.SetName(name);
    }

    SetName(name)
    {
        this.name = name;
    }

    SetDuration(duration)
    {
        this.duration_days = duration;
    }

    DetachFromParent()
    {
        if(this._parent != null) {
            // Remove from any existing parents
            let idx = this.ChildIndexInParent();
            this._parent.children.splice(idx,1);
            this._parent = null;
        }
    }

    AddChild(task, idx=-1)
    {
        if(task._parent != null && task._parent != this) {
            task.DetachFromParent();
        }

        // Update parent to this.
        if(idx < 0 ) idx = this.children.length;
        this.children.splice(idx, 0, task);
        task._parent = this;
    }

    IsParent()
    {
        return this.children.length > 0;
    }

    IsLeaf()
    {
        return !this.IsParent();
    }

    DurationDays()
    {
        if(this.duration_days && this.IsLeaf()) {
            return this.duration_days;
        }else{
            let duration_ms = this._end_ms - this._start_ms;
            return Math.round(duration_ms / (1E3*60*60*24));
        }
    }

    ChildIndexInParent()
    {
        if(this._parent) {
            let p = this._parent;
            return p.children.indexOf(this);
        }else{
            return null;
        }
    }

    GetDescendents()
    {
        let task_list = [];
        for(let c=0; c < this.children.length; ++c) {
            task_list.push(this.children[c]);
            task_list = task_list.concat(this.children[c].GetDescendents());
        }
        return task_list;
    }

    // Given leafs start and end dates, recompute all parent dates
    UpdateStartEndCache()
    {
        if(this.IsParent()) {
            // Invalidate range
            this._start_ms = Number.MAX_VALUE;
            this._end_ms = Number.MIN_VALUE;

            // Take min/max of children.
            for(let c=0; c < this.children.length; ++c) {
                let child = this.children[c];
                child.UpdateStartEndCache();
                this._start_ms = Math.min(this._start_ms, child._start_ms);
                this._end_ms = Math.max(this._end_ms, child._end_ms);
            }
        }
    }
}
